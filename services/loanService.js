const { Readable } = require("stream");
const { google } = require("googleapis");

const { CustomerRegistration } = require("../models/customerRegistrationModel");
const { FileGeneration } = require("../models/fileGenerationModel");
const { Lead } = require("../models/leadModel");
const { Loan } = require("../models/loanModel");
const { LoanDoc } = require("../models/loanDocModel");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

// Helper: get or create folder
async function getOrCreateCustomerFolder(folderName, parentFolderId) {
  const existing = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  if (existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

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

// Helper: find file in folder
async function findFileInFolder(fileName, folderId) {
  const res = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files.length ? res.data.files[0] : null;
}

async function uploadLoanDocs(files, customerName, csNo, loanId) {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const folderName = `${csNo} ${customerName}`;

  try {
    // Get or create folder
    const customerFolderId = await getOrCreateCustomerFolder(
      folderName,
      rootFolderId,
    );

    const uploadPromises = files.map(async (file) => {
      const fileName = file.fieldname; // use original filename

      // Check if file exists
      const existingFile = await findFileInFolder(fileName, customerFolderId);

      let response;

      if (existingFile) {
        // Replace file
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
        // Upload new
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

      // Save in loan_docs table (upsert)
      await LoanDoc.upsert(
        {
          loan_id: loanId,
          doc_name: fileName,
          url: response.data.webViewLink,
          created_at: new Date(),
        },
        {
          conflictFields: ["loan_id", "doc_name"], // ensure no duplicates
        },
      );

      return {
        name: fileName,
        url: response.data.webViewLink,
        fileId: response.data.id,
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("❌ Google Drive LoanDoc Upload Error:", error.message);
    throw error;
  }
}

async function findCustomerName(leadId, customerId) {
  try {
    const registration = await CustomerRegistration.findOne({
      where: { customer_id: customerId },
    });

    const registrationId = registration ? registration.id : null;

    let cs_no = null;
    if (registrationId) {
      const fileGen = await FileGeneration.findOne({
        where: { registration_id: registrationId },
        attributes: ["cs_no"],
      });
      cs_no = fileGen ? fileGen.cs_no : null;
    }

    const lead = await Lead.findByPk(leadId, { attributes: ["customer_name"] });
    const customer_name = lead ? lead.customer_name : null;

    const loan = await Loan.findOne({
      where: { customer_id: customerId },
      attributes: ["id"],
    });
    const loan_id = loan ? loan.id : null;

    return {
      registrationId,
      cs_no,
      customer_name,
      loan_id,
    };
  } catch (error) {
    console.error("Error in findCustomerName:", error);
    throw error;
  }
}

async function byCustomerId(customerId) {
  try {
    const result = await Loan.findOne({
      where: { customer_id: customerId },
    });

    return result;
  } catch (error) {
    console.error("Error fetching loan by customerId:", error);
    throw error;
  }
}

async function updateLoanByCustomerId(customerId, updateData) {
  try {
    // Check if loan exists
    const existingLoan = await Loan.findOne({
      where: { customer_id: customerId },
    });

    if (!existingLoan) {
      return null;
    }

    // Update loan
    await Loan.update(updateData, {
      where: { customer_id: customerId },
    });

    // Return updated record
    const updatedLoan = await Loan.findOne({
      where: { customer_id: customerId },
    });

    return updatedLoan;
  } catch (error) {
    console.error("Error updating loan:", error);
    throw error;
  }
}

module.exports = {
  uploadLoanDocs,
  findCustomerName,
  byCustomerId,
  updateLoanByCustomerId,
};
