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
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { Loan } = require("../models/loanModel");

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
            "customer_id",
            "registration_date",
            "agreement_date",
            "inverter_qty",
            "panel_qty",
            "status",
          ],
          required: true,
          where: {
            status: {
              [Op.in]: ["pending", "approved"],
            },
          },
        },
        {
          model: Loan,
          as: "loans",
          attributes: ["id"], // only need id
          required: false, // important
        },
      ],

      order: [[sequelize.col("lead.created_at"), "DESC"]],
    });

    // ✅ Append boolean flag
    const result = customers.map((c) => {
      const data = c.toJSON();

      return {
        ...data,
        hasLoan: data.loans && data.loans.length > 0, // ✅ correct
      };
    });

    return result;
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
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

    return updatedFolder.data.id;
  } catch (error) {
    console.error("Error renaming folder:", error.message);
    throw error;
  }
}

async function completeRegistration(registrationId, customerId) {
  const t = await sequelize.transaction();

  try {
    // 1️⃣ Find registration
    const registration = await CustomerRegistration.findOne({
      where: { id: registrationId },
      transaction: t,
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    // 2️⃣ Validate
    if (registration.status !== "approved") {
      throw new Error("Registration is not approved");
    }

    // 3️⃣ Update registration
    await registration.update({ status: "done" }, { transaction: t });

    // 4️⃣ Update stage
    await CustomerStage.update(
      {
        status: "done",
        completed_at: new Date(),
      },
      {
        where: {
          customer_id: customerId,
          stage_id: 4,
        },
        transaction: t,
      },
    );

    let kit = await KitReady.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (!kit) {
      kit = await KitReady.create(
        {
          customer_id: customerId,
          loan_status: "pending", // ✅ condition applied
          status: "pending",
          file_gen: "pending",
        },
        { transaction: t },
      );
    }

    await t.commit();

    return registration;
  } catch (error) {
    await t.rollback();
    console.error("❌ completeRegistration error:", error);
    throw error;
  }
}

async function markRegistrationAsDone(
  registrationId,
  customerId,
  leadId,
  kitId,
  data,
) {
  const t = await sequelize.transaction();

  try {
    const {
      cs_no,
      panel_brand_id,
      inverter_brand_id,
      panel_id,
      panel_qty,
      inverter_id,
      inverter_qty,
    } = data;

    // 🔹 Registration
    const registration = await CustomerRegistration.findOne({
      where: { id: registrationId },
      transaction: t,
    });

    if (!registration) {
      throw new Error(`Registration not found`);
    }

    if (registration.status !== "done") {
      return { success: false, message: "Status is not 'approved'" };
    }

    registration.status = "done";
    await registration.save({ transaction: t });

    await CustomerStage.update(
      { status: "done", completed_at: new Date() },
      {
        where: { customer_id: customerId, stage_id: 4 },
        transaction: t,
      },
    );

    // 🔹 Lead
    const lead = await Lead.findByPk(leadId, { transaction: t });
    if (!lead) throw new Error("Lead not found");

    // 🔴 Validate quantities
    if (panel_qty > lead.number_of_panels) {
      throw new Error("Panel qty exceeds requirement");
    }

    if (inverter_qty > lead.number_of_inverters) {
      throw new Error("Inverter qty exceeds requirement");
    }

    // 🔹 Lock inventory rows
    const panelInventory = await Inventory.findByPk(panel_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const inverterInventory = await Inventory.findByPk(inverter_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!panelInventory || panelInventory.qty < panel_qty) {
      throw new Error("Panel stock unavailable");
    }

    if (!inverterInventory || inverterInventory.qty < inverter_qty) {
      throw new Error("Inverter stock unavailable");
    }

    // 🔹 Customer Docs
    const customerDocs = await CustomerDocument.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    // 🔹 Kit
    let kit = await KitReady.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    // ✅ NEW: Insert category_id = 2 items with qty = 0
    const categoryItems = await Inventory.findAll({
      where: { category_id: 2 },
      attributes: ["id"],
      transaction: t,
    });

    const bulkData = categoryItems.map((item) => ({
      kit_id: kit.id,
      inventory_id: item.id,
      qty: 0,
      status: "pending",
    }));

    if (bulkData.length > 0) {
      await KitItems.bulkCreate(bulkData, {
        transaction: t,
        ignoreDuplicates: true,
      });
    }

    // 🔹 Allocate panel + inverter
    await KitItems.upsert(
      {
        kit_id: kit.id,
        inventory_id: panel_id,
        qty: panel_qty,
        status: "allocated",
      },
      { transaction: t },
    );

    await KitItems.upsert(
      {
        kit_id: kit.id,
        inventory_id: inverter_id,
        qty: inverter_qty,
        status: "allocated",
      },
      { transaction: t },
    );

    // 🔹 Deduct stock (atomic safe)
    const [panelUpdated] = await Inventory.update(
      { qty: sequelize.literal(`qty - ${panel_qty}`) },
      {
        where: {
          id: panel_id,
          qty: { [Op.gte]: panel_qty },
        },
        transaction: t,
      },
    );

    if (panelUpdated === 0) {
      throw new Error("Panel stock insufficient during update");
    }

    const [inverterUpdated] = await Inventory.update(
      { qty: sequelize.literal(`qty - ${inverter_qty}`) },
      {
        where: {
          id: inverter_id,
          qty: { [Op.gte]: inverter_qty },
        },
        transaction: t,
      },
    );

    if (inverterUpdated === 0) {
      throw new Error("Inverter stock insufficient during update");
    }

    // 🔹 Rename Folder
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const oldFolderName = `${lead.customer_name}_${lead.contact_number}`;
    const newFolderName = `${cs_no} ${lead.customer_name}`;

    await renameCustomerFolder(oldFolderName, newFolderName, rootFolderId);

    // 🔹 File Generation
    const existingFile = await FileGeneration.findOne({
      where: { registration_id: registrationId },
      transaction: t,
    });

    if (!existingFile) {
      await FileGeneration.create(
        {
          registration_id: registrationId,
          cs_no,
          panel_brand_id,
          inverter_brand_id,

          consumer_number: customerDocs?.consumer_number || null,
          geo_location: customerDocs?.geo_coordinate || null,
          subdivision: customerDocs?.sub_division || null,

          inverter_capacity: lead?.inverter_capacity
            ? parseFloat(lead.inverter_capacity)
            : null,
          inverter_quantity: lead?.number_of_inverters || null,

          beneficiary_name: lead?.customer_name || null,
          beneficiary_address: lead?.address || null,
          consumer_contact: lead?.contact_number || null,

          panel_quantity: lead?.number_of_panels || null,
          panel_capacity: lead?.panel_wattage || null,

          application_number: registration?.application_number || null,
          registration_date: registration?.registration_date || null,
          agreement_date: registration?.agreement_date || null,
        },
        { transaction: t },
      );

      await KitReady.update(
        { file_gen: "done" },
        {
          where: { id: kitId },
          transaction: t,
        },
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
    console.error("❌ Error:", error);
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
async function getCustomersByStatus(fileGenStatus) {
  try {
    if (!fileGenStatus || !["pending", "done"].includes(fileGenStatus)) {
      throw new Error("Invalid status. Must be 'pending' or 'done'");
    }

    // 1️⃣ Get customer_ids from KitReady
    const kits = await KitReady.findAll({
      where: { file_gen: fileGenStatus },
      attributes: ["customer_id"],
    });

    const customerIds = kits.map((k) => k.customer_id);

    if (!customerIds.length) {
      return [];
    }

    // 2️⃣ Fetch registrations for those customers
    const registrations = await CustomerRegistration.findAll({
      where: {
        customer_id: customerIds,
      },
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
          attributes: ["id", "status"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: [
                "id",
                "customer_name",
                "contact_number",
                "address",
                "panel_wattage",
                "number_of_panels",
                "inverter_kw",
                "total_capacity",
                "created_at",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // 3️⃣ Format response
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
      panel_wattage: reg.customer?.lead?.panel_wattage || null,
      inverter_kw: reg.customer?.lead?.inverter_kw || null,
      total_capacity: reg.customer?.lead?.total_capacity || null,
    }));

    return result;
  } catch (error) {
    console.error("❌ Error fetching customers by file_gen:", error);
    throw error;
  }
}

async function getInventoryByCategory(id) {
  try {
    const inventory = await Inventory.findAll({
      where: { category_id: id },
      attributes: ["id", "name", "qty"],
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "name"], // include brand name
        },
      ],
      order: [["name", "ASC"]],
    });

    return inventory;
  } catch (error) {
    throw error;
  }
}

async function getFileGenerationBasicDetails(registrationId) {
  try {
    if (!registrationId) {
      throw new Error("registrationId is required");
    }

    const fileGen = await FileGeneration.findOne({
      where: { registration_id: registrationId },
      attributes: [
        "beneficiary_name",
        "consumer_contact",
        "beneficiary_address",
        "panel_capacity",
        "inverter_capacity",
      ],
    });

    if (!fileGen) {
      return null;
    }

    return {
      name: fileGen.beneficiary_name,
      contact: fileGen.consumer_contact,
      address: fileGen.beneficiary_address,
      panel_capacity: fileGen.panel_capacity,
      inverter_capacity: fileGen.inverter_capacity,
    };
  } catch (error) {
    throw error;
  }
}

async function updateFileGenerationAndLead({
  registrationId,
  leadId,
  name,
  contact,
  address,
  panel_capacity,
  inverter_capacity,
}) {
  const t = await sequelize.transaction();

  try {
    if (!registrationId || !leadId) {
      throw new Error("registrationId and leadId are required");
    }

    // 🔹 Update FileGeneration
    const fileGen = await FileGeneration.findOne({
      where: { registration_id: registrationId },
      transaction: t,
    });

    if (!fileGen) {
      await t.rollback();
      return { success: false, message: "File generation not found" };
    }

    await fileGen.update(
      {
        beneficiary_name: name,
        consumer_contact: contact,
        beneficiary_address: address,
        panel_capacity,
        inverter_capacity,
      },
      { transaction: t },
    );

    // 🔹 Update Lead
    const lead = await Lead.findByPk(leadId, { transaction: t });

    if (!lead) {
      await t.rollback();
      return { success: false, message: "Lead not found" };
    }

    await lead.update(
      {
        customer_name: name,
        contact_number: contact,
        address: address,
        panel_wattage: panel_capacity, // ⚠️ assuming mapping
        inverter_kw: inverter_capacity,
      },
      { transaction: t },
    );

    await t.commit();

    return {
      success: true,
      message: "File generation and lead updated successfully",
    };
  } catch (error) {
    await t.rollback();
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
  getInventoryByCategory,
  getFileGenerationBasicDetails,
  updateFileGenerationAndLead,
  completeRegistration,
};
