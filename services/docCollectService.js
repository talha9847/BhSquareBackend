const { Customer } = require("../models/customerModel");
const { Lead } = require("../models/leadModel");
const { CustomerDocument } = require("../models/customerDocumentModel");
const { CustomerDocumentFile } = require("../models/customerDocumentFileModel");
const { google } = require("googleapis");
const { Readable } = require("stream");
const path = require("path");
const { CustomerStage } = require("../models/customerStageModel");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
const sequelize = require("../config/db");
const { Op } = require("sequelize");
const { exec } = require("child_process");
const { Backup } = require("../models/backupModel");

// Replace the old Service Account Auth with this:
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground", // or your redirect URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN, // Use the token you got from Playground
});

const drive = google.drive({ version: "v3", auth: oauth2Client });
async function getOrCreateCustomerFolder(
  folderName,
  parentFolderId,
  customerId,
) {
  const existing = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  let folderId;

  if (existing.data.files.length > 0) {
    folderId = existing.data.files[0].id;
  } else {
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id",
    });

    folderId = folder.data.id;
  }

  // ✅ ONLY UPDATE (since record already exists)
  if (customerId) {
    await CustomerDocument.update(
      {
        folder_id: folderId,
        updated_at: new Date(),
      },
      {
        where: { customer_id: customerId },
      },
    );
  }

  return folderId;
}

async function findFileInFolder(fileName, folderId) {
  const res = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files.length ? res.data.files[0] : null;
}

// 2. Updated Upload function
async function uploadBulkFiles(
  files,
  customerName,
  contactNumber,
  docId,
  customerId,
) {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const folderName = `${customerName}_${contactNumber}`;

  try {
    let customerDoc;
    // Get or create the specific customer folder
    if (!docId || docId == 0) {
      customerDoc = await CustomerDocument.findOne({
        where: { customer_id: customerId },
      });

      if (!customerDoc) {
        throw new Error(`No document found for customerId: ${customerId}`);
      }

      // 🔥 Set docId from DB
      docId = customerDoc.id;
    } else {
      // ✅ If docId is provided → validate it belongs to customer
      customerDoc = await CustomerDocument.findOne({
        where: {
          id: docId,
          customer_id: customerId,
        },
      });

      if (!customerDoc) {
        throw new Error(`Invalid docId ${docId} for customerId ${customerId}`);
      }
    }

    const customerFolderId = await getOrCreateCustomerFolder(
      folderName,
      rootFolderId,
      customerId,
    );

    const uploadPromises = files.map(async (file) => {
      const fileName = file.fieldname;

      // Check if file already exists in Google Drive
      const existingFile = await findFileInFolder(fileName, customerFolderId);

      let response;

      if (existingFile) {
        // Replace existing file
        response = await drive.files.update({
          fileId: existingFile.id,
          media: {
            mimeType: file.mimetype || "application/octet-stream",
            body: Readable.from(file.buffer),
          },
          supportsAllDrives: true,
          fields: "id, webViewLink",
        });
      } else {
        // Upload new file
        response = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [customerFolderId],
          },
          media: {
            mimeType: file.mimetype || "application/octet-stream",
            body: Readable.from(file.buffer),
          },
          supportsAllDrives: true,
          fields: "id, webViewLink",
        });
      }

      const fileUrl = response.data.webViewLink;

      // Save or update in DB using upsert to avoid duplicates
      await CustomerDocumentFile.upsert(
        {
          document_id: docId,
          file_name: fileName,
          file_url: fileUrl,
          uploaded_at: new Date(),
          updated_at: new Date(),
        },
        {
          conflictFields: ["document_id", "file_name"], // ← Important!
        },
      );
      return {
        name: fileName,
        url: fileUrl,
        fileId: response.data.id,
      };
    });

    // Wait for all uploads + DB saves to finish
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("❌ Google Drive Error:", error.message);
    throw error;
  }
}

async function getLeadDetailFromCustomerId(customer_id) {
  try {
    const customer = await Customer.findByPk(customer_id, {
      include: {
        model: Lead,
        as: "lead",
        attributes: [
          "id",
          "customer_name",
          "contact_number",
          "site_visit_date",
          "address",
          "total_capacity",
          "panel_wattage",
          "number_of_panels",
          "number_of_inverters",
          "inverter_kw",
          "inverter_capacity",
        ],
      },
    });

    if (!customer || !customer.lead) return null;

    return customer.lead; // return the lead object
  } catch (error) {
    throw error;
  }
}

async function getCustomerDocumentByCustomerId(customer_id) {
  try {
    if (!customer_id) throw new Error("customer_id is required");

    const document = await CustomerDocument.findOne({
      where: { customer_id },
    });

    // Returns the document if found, else null
    return document || null;
  } catch (error) {
    console.error("Error fetching customer document:", error.message);
    throw error;
  }
}

async function upsertCustomerDocument(customer_id, data) {
  try {
    if (!customer_id) throw new Error("customer_id is required");

    let document = await CustomerDocument.findOne({ where: { customer_id } });

    if (document) {
      await document.update(data);
    } else {
      document = await CustomerDocument.create({ customer_id, ...data });
    }

    return document;
  } catch (error) {
    console.error("Error in upsertCustomerDocument:", error.message);
    throw error;
  }
}

async function checkCustomerReady(customerId) {
  const customerDocument = await CustomerDocument.findOne({
    where: { customer_id: customerId },
    include: { model: CustomerDocumentFile, as: "files", attributes: ["id"] },
  });

  if (!customerDocument) {
    return {
      status: false,
      message: "No document record found for this customer.",
    };
  }

  const uploadedCount = customerDocument.files.length;

  if (uploadedCount >= 2) {
    return {
      status: true,
      message: `Customer has ${uploadedCount} documents. Ready for next stage.`,
    };
  }

  return {
    status: false,
    message: `Customer has only ${uploadedCount} documents. Minimum 4 required.`,
  };
}

async function completeStageAndPrepareNext(customerId) {
  const readiness = await checkCustomerReady(customerId);

  if (!readiness.status) {
    return {
      success: false,
      message: readiness.message,
    };
  }
  const t = await sequelize.transaction();

  try {
    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) throw new Error("Customer not found");

    await Customer.update(
      { status: "done" },
      { where: { id: customerId }, transaction: t },
    );

    await CustomerStage.update(
      { status: "done", completed_at: new Date() },
      { where: { customer_id: customerId, stage_id: 3 }, transaction: t },
    );

    await CustomerStage.update(
      { status: "pending", started_at: new Date() },
      { where: { customer_id: customerId, stage_id: 4 }, transaction: t },
    );

    const lead = await Lead.findByPk(customer.lead_id, { transaction: t });
    if (!lead) throw new Error("Lead not found");

    const panelQty = lead.number_of_panels || 0;
    const inverterQty = lead.number_of_inverters;

    const existingRegistration = await CustomerRegistration.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (!existingRegistration) {
      await CustomerRegistration.create(
        {
          customer_id: customerId,
          panel_qty: panelQty,
          application_number: null,
          agreement_date: null,
          inverter_qty: inverterQty,
        },
        { transaction: t },
      );
    }

    await t.commit();
    return {
      success: true,
      message: "Stage completed and next stage prepared",
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function checkDocumentCollectionAccess(customer_id) {
  if (!customer_id) {
    throw new Error("customer_id is required");
  }

  const customer = await Customer.findOne({
    where: {
      id: customer_id,
      status: "pending",
      name_change: {
        [Op.in]: ["unchanged", "changed"],
      },
    },
  });

  if (!customer) {
    throw new Error("Document collection not allowed for this customer");
  }

  return customer;
}

async function checkDocAccess(customer_id) {
  if (!customer_id) {
    throw new Error("customer_id is required");
  }

  const customer = await Customer.findOne({
    where: {
      id: customer_id,
      status: "pending",
      name_change: "required",
    },
  });

  if (!customer) {
    throw new Error("Document collection not allowed for this customer");
  }

  return customer;
}

// services/customerDocumentService.js

async function getCustomerDocumentsWithFiles(customerId) {
  try {
    if (!customerId) {
      throw new Error("customerId is required");
    }

    // 🔹 Step 1: Get customer document
    const document = await CustomerDocument.findOne({
      where: { customer_id: customerId },
    });

    if (!document) {
      return {
        success: false,
        message: "Customer document not found",
      };
    }

    // 🔹 Step 2: Get files using document_id
    const files = await CustomerDocumentFile.findAll({
      where: { document_id: document.id },
      order: [["id", "DESC"]],
    });

    // 🔹 Step 3: Format response
    const result = {
      document_id: document.id,
      customer_id: document.customer_id,
      consumer_number: document.consumer_number,
      geo_coordinate: document.geo_coordinate,
      registration_number: document.registration_number,
      sub_division: document.sub_division,

      files: files.map((f) => ({
        id: f.id,
        file_name: f.file_name,
        file_url: f.file_url,
        uploaded_at: f.uploaded_at,
      })),
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching customer documents:", error);
    return { success: false, message: error.message };
  }
}

const BACKUP_FOLDER_ID = "1pnk1TMq43xCyWQM2yg1LFr9vfTLz-vag";

function createDBDumpStream() {
  const dbUrl = process.env.DATABASE_URL;

  const child = exec(`pg_dump "${dbUrl}"`, {
    maxBuffer: 1024 * 1024 * 50,
  });

  return child.stdout;
}

async function uploadToDrive(stream, fileName) {
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [BACKUP_FOLDER_ID],
    },
    media: {
      mimeType: "application/sql",
      body: stream,
    },
    fields: "id, webViewLink",
  });

  return {
    fileId: response.data.id,
    fileUrl: response.data.webViewLink,
  };
}

async function createOrUpdateBackup() {
  try {
    const now = new Date();

    const fileName = `backup_${now.toISOString().replace(/[:.]/g, "-")}.sql`;
    const stream = createDBDumpStream();

    const driveResult = await uploadToDrive(stream, fileName);

    const existing = await Backup.findOne({
      where: { id: 1 },
    });

    if (existing) {
      // 🔥 UPDATE existing row
      await Backup.update(
        {
          backup_datetime: new Date(),
          file_url: driveResult.fileUrl,
          updated_at: new Date(),
        },
        {
          where: { id: 1 },
        },
      );
    } else {
      // 🔥 INSERT new row
      await Backup.create({
        id: 1,
        backup_datetime: new Date(),
        file_url: driveResult.fileUrl,
      });
    }

    return {
      fileUrl: driveResult.fileUrl,
      message: "Backup completed successfully",
    };
  } catch (error) {
    console.error("Backup Error:", error);
    throw error;
  }
}

async function getBackup() {
  try {
    const backup = await Backup.findOne({
      where: { id: 1 },
    });

    if (!backup) {
      return {
        id: null,
        backup_datetime: null,
        file_url: null,
      };
    }

    return {
      id: backup.id,
      backup_datetime: backup.updated_at,
      file_url: backup.file_url,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getLeadDetailFromCustomerId,
  getCustomerDocumentByCustomerId,
  upsertCustomerDocument,
  uploadBulkFiles,
  checkCustomerReady,
  completeStageAndPrepareNext,
  checkDocumentCollectionAccess,
  checkDocAccess,
  getCustomerDocumentsWithFiles,
  createOrUpdateBackup,
  getBackup,
};
