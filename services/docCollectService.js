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

async function getOrCreateCustomerFolder(folderName, parentFolderId) {
  const existing = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  if (existing.data.files.length > 0) {
    console.log(
      `📂 Folder exists: ${folderName} (ID: ${existing.data.files[0].id})`,
    );
    return existing.data.files[0].id;
  }

  // Create it if it doesn't exist
  console.log(`📁 Creating new folder: ${folderName}`);
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  return folder.data.id;
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
async function uploadBulkFiles(files, customerName, contactNumber, docId) {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const folderName = `${customerName}_${contactNumber}`;

  try {
    // Get or create the specific customer folder
    const customerFolderId = await getOrCreateCustomerFolder(
      folderName,
      rootFolderId,
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
    console.log(document + "is null", data);
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

  if (uploadedCount >= 4) {
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
      { status: "done", updated_at: new Date() },
      { where: { customer_id: customerId, stage_id: 3 }, transaction: t },
    );

    await CustomerStage.update(
      { status: "pending", updated_at: new Date() },
      { where: { customer_id: customerId, stage_id: 4 }, transaction: t },
    );

    const lead = await Lead.findByPk(customer.lead_id, { transaction: t });
    if (!lead) throw new Error("Lead not found");

    const panelQty = lead.number_of_panels || 0;

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
          inverter_qty: null,
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

module.exports = {
  getLeadDetailFromCustomerId,
  getCustomerDocumentByCustomerId,
  upsertCustomerDocument,
  uploadBulkFiles,
  checkCustomerReady,
  completeStageAndPrepareNext,
  checkDocumentCollectionAccess,
  checkDocAccess,
};
