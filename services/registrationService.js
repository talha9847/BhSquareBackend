const sequelize = require("../config/db");
const { Lead } = require("../models/leadModel");
const { Customer } = require("../models/customerModel");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
const { PanelSerial } = require("../models/panelSerialModel");
const { FileGeneration } = require("../models/fileGenerationModel");
const { CustomerDocument } = require("../models/customerDocumentModel");
const { KitReady } = require("../models/kitReadyModel");
const { Brand } = require("../models/brandModel");
const { google } = require("googleapis");
const { CustomerStage } = require("../models/customerStageModel");
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

async function getCustomersWithSummary() {
  try {
    const customers = await Customer.findAll({
      attributes: ["id"],

      include: [
        {
          model: Lead,
          as: "lead",
          attributes: [
            "id",
            "customer_name",
            "contact_number",
            "address",
            "number_of_panels",
            "number_of_inverters",
            "inverter_capacity",
            "total_capacity",
            "created_at",
          ],
        },
        {
          model: CustomerRegistration,
          as: "registration",
          attributes: [
            "id",
            "application_number",
            "registration_date",
            "agreement_date",
            "inverter_qty",
            "panel_qty",
            "status",
          ],
          required: true, // only include customers with a registration
          where: {
            status: {
              [Op.in]: ["pending", "approved"],
            },
          },
        },
      ],

      order: [
        [sequelize.col("lead.created_at"), "DESC"], // order by lead creation date
      ],
    });

    return customers;
  } catch (error) {
    console.error("❌ Error fetching pending customers:", error);
    throw error;
  }
}

// async function getCustomersWithSummary() {
//   try {
//     const customers = await Customer.findAll({
//       attributes: ["id"],

//       include: [
//         {
//           model: Lead,
//           as: "lead",
//           attributes: [
//             "id",
//             "customer_name",
//             "contact_number",
//             "address",
//             "number_of_panels",
//             "total_capacity",
//             "created_at",
//           ],
//         },
//         {
//           model: CustomerRegistration,
//           as: "registration",
//           attributes: [
//             "id",
//             "application_number",
//             "registration_date",
//             "agreement_date",
//             "inverter_qty",
//             "panel_qty",
//             "status",
//           ],
//           required: true, // only include customers who have a registration
//           // include: [
//           //   {
//           //     model: PanelSerial,
//           //     as: "panels", // make sure association alias is correct in your model
//           //     attributes: ["id", "serial_number", "created_at"],
//           //   },
//           // ],
//         },
//       ],

//       order: [
//         [
//           sequelize.literal(`
//         CASE
//           WHEN "Customer"."status" = 'pending' THEN 0
//           WHEN "Customer"."status" = 'done' THEN 1
//           ELSE 2
//         END
//       `),
//           "ASC",
//         ],
//         [sequelize.col("lead.created_at"), "DESC"],
//       ],
//     });

//     return customers;
//   } catch (error) {
//     throw error;
//   }
// }

async function getNumberOfPanelsByLeadId(leadId) {
  try {
    // Fetch the lead by ID
    const lead = await Lead.findByPk(leadId, {
      attributes: ["number_of_panels", "number_of_inverters"], // only fetch this column
    });

    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    return {
      success: true,
      number_of_panels: lead.number_of_panels,
      number_of_inverters: lead.number_of_inverters,
    };
  } catch (error) {
    console.error("❌ Error fetching number of panels:", error);
    throw error;
  }
}

async function createCustomerRegistrationWithPanels(
  customerId,
  registrationData,
) {
  const t = await sequelize.transaction();

  try {
    // Step 1: Create or update CustomerRegistration
    let registration = await CustomerRegistration.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (registration) {
      await registration.update(
        {
          application_number: registrationData.application_number,
          agreement_date: registrationData.agreement_date,
          inverter_qty: registrationData.inverter_qty,
          registration_date: registrationData.registration_date,
          panel_qty: registrationData.panel_qty,
          status: "approved",
        },
        { transaction: t },
      );
    } else {
      registration = await CustomerRegistration.create(
        {
          customer_id: customerId,
          application_number: registrationData.application_number,
          agreement_date: registrationData.agreement_date,
          registration_date: registrationData.registration_date,
          inverter_qty: registrationData.inverter_qty,
          panel_qty: registrationData.panel_qty,
          status: "approved",
        },
        { transaction: t },
      );
    }

    // Step 2: Handle panel serials
    // if (
    //   registrationData.panel_serials &&
    //   registrationData.panel_serials.length > 0
    // ) {
    //   // Delete existing panels if any
    //   await PanelSerial.destroy({
    //     where: { registration_id: registration.id },
    //     transaction: t,
    //   });

    //   // Prepare new panel rows
    //   const panelRows = registrationData.panel_serials.map((panel) => ({
    //     registration_id: registration.id,
    //     serial_number: panel.value,
    //     status: "active",
    //     created_at: new Date(),
    //   }));

    //   // Bulk insert
    //   await PanelSerial.bulkCreate(panelRows, { transaction: t });
    // }

    await t.commit();
    return { success: true, registration_id: registration.id };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error creating registration with panels:", error);
    throw error;
  }
}

async function renameCustomerFolder(
  oldFolderName,
  newFolderName,
  parentFolderId,
) {
  try {
    // 1. Find the existing folder ID
    const searchResult = await drive.files.list({
      q: `name='${oldFolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    if (searchResult.data.files.length === 0) {
      console.warn(
        `⚠️ Folder "${oldFolderName}" not found. Nothing to rename.`,
      );
      return null;
    }

    const folderId = searchResult.data.files[0].id;

    // 2. Update the folder name
    const updatedFolder = await drive.files.update({
      fileId: folderId,
      requestBody: {
        name: newFolderName,
      },
      fields: "id, name",
    });

    console.log(`✅ Folder renamed to: ${updatedFolder.data.name}`);
    return updatedFolder.data.id;
  } catch (error) {
    console.error("Error renaming folder:", error.message);
    throw error;
  }
}

async function markRegistrationAsDone(
  registrationId,
  customerId,
  leadId,
  data,
) {
  const t = await sequelize.transaction();

  try {
    const {
      cs_no,
      panel_brand_id,
      inverter_brand_id,
      inverter_capacity,
      inverter_qty,
    } = data;

    const registration = await CustomerRegistration.findOne({
      where: { id: registrationId },
      transaction: t,
    });

    if (!registration) {
      throw new Error(`Registration with ID ${registrationId} not found`);
    }

    if (registration.status === "approved") {
      registration.status = "done";
      await registration.save({ transaction: t });

      await CustomerStage.update(
        { status: "done", completed_at: new Date() },
        {
          where: {
            customer_id: customerId,
            stage_id: 4,
          },
          transaction: t,
        },
      );
    } else {
      return { success: false, message: `Status is not 'approved'` };
    }

    // ✅ fetch required data
    const lead = await Lead.findByPk(leadId, { transaction: t });
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const oldFolderName = `${lead.customer_name}_${lead.contact_number}`;
    const newFolderName = `${cs_no} ${lead.customer_name}`;
    const customerDocs = await CustomerDocument.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    const existingKit = await KitReady.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (!existingKit) {
      await KitReady.create(
        {
          customer_id: customerId,
          loan_status: "pending",
          status: "pending",
        },
        { transaction: t },
      );
    }
    const folderId = await renameCustomerFolder(
      oldFolderName,
      newFolderName,
      rootFolderId,
    );
    //here i want to change the gDrive folder name which is lead.customername_lead.contact_number to  "cs_no lead.customer_name"

    // ✅ check existing
    const existingFile = await FileGeneration.findOne({
      where: { registration_id: registrationId },
      transaction: t,
    });

    if (!existingFile) {
      await FileGeneration.create(
        {
          registration_id: registrationId,

          // 🔹 from body
          cs_no,
          panel_brand_id,
          inverter_brand_id,
          inverter_capacity: inverter_capacity
            ? parseFloat(inverter_capacity)
            : null,
          inverter_quantity: inverter_qty,
          // 🔹 from customer_documents
          consumer_number: customerDocs?.consumer_number || null,
          geo_location: customerDocs?.geo_coordinate || null,
          subdivision: customerDocs?.sub_division || null,

          // 🔹 from lead
          beneficiary_name: lead?.customer_name || null,
          beneficiary_address: lead?.address || null,
          consumer_contact: lead?.contact_number || null,
          panel_quantity: lead?.number_of_panels || null,
          panel_capacity: lead?.panel_wattage || null,
          system_capacity: lead?.total_capacity || null,

          // 🔹 from registration
          application_number: registration?.application_number || null,
          registration_date: registration?.registration_date || null,
          agreement_date: registration?.agreement_date || null,
        },
        { transaction: t },
      );
    }

    await t.commit();

    return {
      success: true,
      registration_id: registration.id,
      new_status: registration.status,
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating registration status:", error);
    throw error;
  }
}

async function getFileGenerationData(registrationId) {
  try {
    const fileData = await FileGeneration.findOne({
      where: { registration_id: registrationId },

      include: [
        {
          model: Brand,
          as: "panelBrand",
          attributes: ["id", "name"],
        },
        {
          model: Brand,
          as: "inverterBrand",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!fileData) {
      return {
        success: false,
        message: "File generation data not found",
      };
    }

    return {
      success: true,
      data: fileData,
    };
  } catch (error) {
    console.error("❌ Error fetching file generation data:", error);
    throw error;
  }
}

async function getCustomersByStatus(status) {
  try {
    if (!status || !["pending", "done"].includes(status)) {
      throw new Error("Invalid status. Must be 'pending' or 'done'.");
    }

    // Step 1: Fetch all CustomerRegistrations with given status
    const registrations = await CustomerRegistration.findAll({
      where: { status },
      attributes: [
        "id",
        "customer_id",
        "application_number",
        "registration_date",
        "agreement_date",
        "panel_qty",
        "inverter_qty",
        "status",
        "created_at",
      ],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "status"], // status in Customer table if needed
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: [
                "id",
                "customer_name",
                "contact_number",
                "address",
                "number_of_panels",
                "total_capacity",
                "created_at",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Step 2: Map to friendly format
    const result = registrations.map((reg) => ({
      registration_id: reg.id,
      registration_status: reg.status,
      registration_date: reg.registration_date,
      agreement_date: reg.agreement_date,
      panel_qty: reg.panel_qty,
      inverter_qty: reg.inverter_qty,
      customer_id: reg.customer?.id || null,
      customer_status: reg.customer?.status || null,
      lead_id: reg.customer?.lead?.id || null,
      customer_name: reg.customer?.lead?.customer_name || null,
      contact_number: reg.customer?.lead?.contact_number || null,
      address: reg.customer?.lead?.address || null,
      number_of_panels: reg.customer?.lead?.number_of_panels || null,
      total_capacity: reg.customer?.lead?.total_capacity || null,
    }));

    return result;
  } catch (error) {
    console.error("❌ Error fetching customers by registration status:", error);
    throw error;
  }
}

module.exports = {
  getCustomersWithSummary,
  getNumberOfPanelsByLeadId,
  createCustomerRegistrationWithPanels,
  markRegistrationAsDone,
  getFileGenerationData,
  getCustomersByStatus,
};
