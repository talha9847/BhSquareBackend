const { NameChange } = require("../models/nameChangeModel");

const { google } = require("googleapis");
const { Readable } = require("stream");
const { Customer } = require("../models/customerModel");
const { CustomerStage } = require("../models/customerStageModel");
const sequelize = require("../config/db");

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
    return existing.data.files[0].id;
  }

  // Create it if it doesn't exist
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

async function uploadNameChangeFiles(
  files,
  customerId,
  customerName,
  contactNumber,
) {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const customerFolderName = `${customerName}_${contactNumber}`;
  const nameChangeFolderName = "name_change";

  try {
    // ✅ Step 1: Get/Create Customer Folder
    const customerFolderId = await getOrCreateCustomerFolder(
      customerFolderName,
      rootFolderId,
    );

    // ✅ Step 2: Get/Create name_change folder inside customer folder
    const nameChangeFolderId = await getOrCreateCustomerFolder(
      nameChangeFolderName,
      customerFolderId,
    );

    // ✅ Step 3: Upload files inside name_change folder
    const uploadPromises = files.map(async (file) => {
      const fileName = file.fieldname;

      const existingFile = await findFileInFolder(fileName, nameChangeFolderId);

      let response;

      if (existingFile) {
        // 🔁 Replace file
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
        // 🆕 Upload new
        response = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [nameChangeFolderId],
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

      // ✅ Save in DB (name_change table)
      await NameChange.upsert(
        {
          customer_id: customerId,
          document_name: fileName,
          document_url: fileUrl,
          is_got: true,
          created_at: new Date(),
        },
        {
          conflictFields: ["customer_id", "document_name"],
        },
      );

      return {
        name: fileName,
        url: fileUrl,
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("❌ NameChange Upload Error:", error.message);
    throw error;
  }
}

async function checkCustomerReady(customerId) {
  const count = await NameChange.count({
    where: { customer_id: customerId, is_got: true },
  });

  if (count >= 3) {
    return {
      status: true,
      message: `Customer has ${count} documents. Ready for next stage.`,
    };
  }

  return {
    status: false,
    message: `Customer has only ${count} documents. Minimum 3 required.`,
  };
}

async function goToStageThree(customerId) {
  const t = await sequelize.transaction();

  try {
    await Customer.update(
      { name_change: "changed" },
      { where: { id: customerId }, transaction: t },
    );

    await CustomerStage.update(
      { status: "done", completed_at: new Date() },
      {
        where: {
          customer_id: customerId,
          stage_id: 2,
        },
        transaction: t,
      },
    );

    await CustomerStage.update(
      { status: "pending", started_at: new Date() },
      {
        where: {
          customer_id: customerId,
          stage_id: 3,
        },
        transaction: t,
      },
    );

    await t.commit();

    return {
      success: true,
      message: "Moved to stage 3 successfully",
    };
  } catch (error) {
    await t.rollback();

    console.error("❌ Stage transition error:", error);

    return {
      success: false,
      message: "Failed to move to stage 3",
      error: error.message,
    };
  }
}

async function getNameChangeDocsByCustomerId(customerId) {
  try {
    if (!customerId) {
      throw new Error("customerId is required");
    }

    const docs = await NameChange.findAll({
      where: { customer_id: customerId },
      attributes: ["id", "document_name", "document_url"],
    });

    // 🔹 if no records → return empty array
    if (!docs || docs.length === 0) {
      return [];
    }

    return docs;
  } catch (error) {
    throw error;
  }
}

const REQUIRED_NAMECHANGE_DOCS = [
  "Passport Size Pic",
  "Aadhar Card",
  "Akarni / Sales Deed / Index-2",
  "Property Card / 7-12 / 8-A",
  "Hakk Patra",
  "Tharav of Authority Signatory",
  "Pan Card (Category Change)",
  "Society Registration",
  "Death Certificate",
  "Samti Patra (Multi-Owner)",
  "Pedhinamu (Multi-Varasdar)",
];

async function getNameChangeDocumentStatus(customerId) {
  try {
    const records = await NameChange.findAll({
      where: { customer_id: customerId },
      attributes: ["id", "document_name", "is_got"],
      raw: true,
    });

    const docMap = new Map();

    for (const doc of records) {
      docMap.set(doc.document_name, {
        id: doc.id,
        is_got: doc.is_got === true || doc.is_got === 1,
      });
    }

    const result = REQUIRED_NAMECHANGE_DOCS.map((docName) => {
      const record = docMap.get(docName);

      return {
        name: docName,
        is_got: record ? record.is_got : false,
        file_id: record ? record.id : null,
        customer_id: customerId,
      };
    });

    return {
      customerId,
      documents: result,
    };
  } catch (error) {
    throw error;
  }
}

async function toggleNameChangeDoc(customerId, fileName) {
  try {
    if (!customerId || !fileName) {
      throw new Error("doc_id and name are required");
    }

    // 🔥 simple validation
    if (!REQUIRED_NAMECHANGE_DOCS.includes(fileName)) {
      throw new Error("Invalid document name");
    }
    const record = await NameChange.findOne({
      where: {
        customer_id: customerId,
        document_name: fileName,
      },
    });

    // ❌ NOT EXISTS → CREATE (true)
    if (!record) {
      const newRecord = await NameChange.create({
        customer_id: customerId,
        document_name: fileName,
        is_got: true,
        document_url:
          "https://drive.google.com/file/d/1fhDNYWcZA_hejGC2p59aty0UOTnNMip4/view?usp=drive_link",
      });

      return {
        message: "Document created",
        is_got: true,
        data: newRecord,
      };
    }

    // 🔁 EXISTS → TOGGLE
    record.is_got = !record.is_got;
    await record.save();

    return {
      message: "Document toggled successfully",
      is_got: record.is_got,
      data: record,
    };
  } catch (error) {
    throw error;
  }
}
module.exports = {
  uploadNameChangeFiles,
  checkCustomerReady,
  goToStageThree,
  getNameChangeDocsByCustomerId,
  getNameChangeDocumentStatus,
  toggleNameChangeDoc,
};
