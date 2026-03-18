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
    where: { customer_id: customerId },
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
      { status: "done" },
      {
        where: {
          customer_id: customerId,
          stage_id: 2,
        },
        transaction: t,
      },
    );

    await CustomerStage.update(
      { status: "pending" },
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

module.exports = { uploadNameChangeFiles, checkCustomerReady, goToStageThree };
