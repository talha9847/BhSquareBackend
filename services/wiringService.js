const sequelize = require("../config/db");
const { CustomerDocument } = require("../models/customerDocumentModel");
const { Customer } = require("../models/customerModel");
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { Lead } = require("../models/leadModel");
const { Technician } = require("../models/technicianModel");
const { WireInventory } = require("../models/wireInventoryModel");
const { WiringDocs } = require("../models/wiringDocModel");
const { WiringItem } = require("../models/wiringItemModel");
const { Wiring } = require("../models/wiringModel");
const { google } = require("googleapis");
const { Readable } = require("stream");

async function getAllTechnicians() {
  try {
    const technicians = await Technician.findAll({
      order: [["created_at", "DESC"]],
    });
    return technicians;
  } catch (error) {
    console.error("Error fetching technicians:", error);
    throw error;
  }
}

async function addTechnician({ name }) {
  try {
    const [technician, created] = await Technician.findOrCreate({
      where: { name },
      defaults: { name },
    });

    if (!created) {
      console.log("Technician already exists:", name);
    }

    return technician;
  } catch (error) {
    console.error("Error creating technician:", error);
    throw error;
  }
}

async function updateTechnician(id, { name }) {
  const t = await sequelize.transaction();
  try {
    const technician = await Technician.findByPk(id, { transaction: t });
    if (!technician) {
      throw new Error("Technician not found");
    }

    technician.name = name ?? technician.name;

    await technician.save({ transaction: t });
    await t.commit();

    return technician;
  } catch (error) {
    await t.rollback();
    console.error("Error updating technician:", error);
    throw error;
  }
}

async function getWiringCustomerDetails() {
  try {
    const wirings = await Wiring.findAll({
      where: { status: "pending" },
      attributes: [
        "id",
        "customer_id",
        "technician_id",
        "status",
        "inventory_status",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: Customer,
          as: "customerForWiring", // 👈 matches Wiring.belongsTo(Customer) alias
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead", // 👈 matches Customer.belongsTo(Lead) alias
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
        {
          model: Technician,
          as: "technician", // 👈 matches Wiring.belongsTo(Technician) alias
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Map to clean JSON
    return wirings.map((w) => ({
      wiring_id: w.id,
      wiring_inv_status: w.inventory_status,
      wiring_status: w.status,
      customer_id: w.customer_id,
      lead_id: w.customerForWiring?.lead?.id || null,
      customer_name: w.customerForWiring?.lead?.customer_name || null,
      contact_number: w.customerForWiring?.lead?.contact_number || null,
      address: w.customerForWiring?.lead?.address || null,
      technician_id: w.technician_id,
      technician_name: w.technician?.name || null,
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching wiring customer details:", error);
    throw error;
  }
}

async function addWireInventory({
  brand_name,
  wire_type,
  color,
  gauge,
  stock,
  price,
  tax,
}) {
  const t = await sequelize.transaction();
  try {
    // Check if the record already exists
    const existingWire = await WireInventory.findOne({
      where: { brand_name, wire_type, color, gauge },
      transaction: t,
    });

    if (existingWire) {
      await t.rollback();
      return {
        success: false,
        message: "Wire inventory already exists with this combination",
      };
    }

    // Create new wire inventory record
    const newWire = await WireInventory.create(
      { brand_name, wire_type, color, gauge, stock, price, tax },
      { transaction: t },
    );

    await t.commit();
    return {
      success: true,
      data: newWire,
      message: "Wire added to inventory",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error adding wire inventory:", error);
    return { success: false, message: error.message };
  }
}

async function getAllWireInventory() {
  try {
    const wires = await WireInventory.findAll({
      order: [["created_at", "DESC"]],
    });

    return {
      success: true,
      data: wires,
    };
  } catch (error) {
    console.error("Error fetching wire inventory:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

async function updateWireInventoryById(id, updateData) {
  const t = await sequelize.transaction();
  try {
    const wire = await WireInventory.findByPk(id, { transaction: t });
    if (!wire) {
      await t.rollback();
      return { success: false, message: "Wire inventory not found" };
    }
    const { brand_name, wire_type, color, gauge, stock, price, tax } =
      updateData;

    // Validate required fields
    if (
      !brand_name ||
      !wire_type ||
      !color ||
      gauge === undefined ||
      stock === undefined
    ) {
      await t.rollback();
      return {
        success: false,
        message:
          "All fields (brand_name, wire_type, color, gauge, stock) are required",
      };
    }

    // Convert numeric fields
    const gaugeNum = parseFloat(gauge);
    const stockNum = parseInt(stock, 10);

    if (isNaN(gaugeNum) || isNaN(stockNum)) {
      await t.rollback();
      return {
        success: false,
        message: "Gauge must be a number and stock must be an integer",
      };
    }

    // Update fields
    wire.brand_name = brand_name;
    wire.wire_type = wire_type;
    wire.color = color;
    wire.gauge = gaugeNum;
    wire.stock = stockNum;
    wire.price = price;
    wire.tax = tax;

    await wire.save({ transaction: t });
    await t.commit();

    return {
      success: true,
      data: wire,
      message: "Wire inventory updated successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error updating wire inventory:", error);
    return { success: false, message: error.message };
  }
}

const { Op } = require("sequelize");
const { CustomerStage } = require("../models/customerStageModel");
const { FileGeneration } = require("../models/fileGenerationModel");
const { CustomerRegistration } = require("../models/customerRegistrationModel");
const { FinalStage } = require("../models/finalStageModel");
const { Fabricator } = require("../models/fabricatorModel");
const { Fabrication } = require("../models/fabricationModel");
const { Commission } = require("../models/commissionModel");
const { Source } = require("../models/sourceModel");
const { UnusedInventory } = require("../models/UnusedInventoryModel");
const { SupervisorCommission } = require("../models/supervisorCommissionModel");
const { Supervisor } = require("../models/supervisorModel");
const { FabricatorCommission } = require("../models/fabricatorCommissionModel");
const { Cost } = require("../models/costModel");
const { KitReady } = require("../models/kitReadyModel");
async function getAvailableWireInventoryForWiring(wiring_id) {
  try {
    // 1️⃣ Get all wire_inventory_ids already assigned to this wiring
    const assignedItems = await WiringItem.findAll({
      where: { wiring_id },
      attributes: ["wire_inventory_id"],
    });

    const assignedIds = assignedItems.map((item) => item.wire_inventory_id);

    // 2️⃣ Fetch all WireInventory not assigned to this wiring
    const availableWires = await WireInventory.findAll({
      where: {
        id: {
          [Op.notIn]: assignedIds.length ? assignedIds : [0],
        },
      },
      order: [["created_at", "DESC"]],
    });

    return {
      success: true,
      data: availableWires,
    };
  } catch (error) {
    console.error("Error fetching available wire inventory:", error);
    return { success: false, message: error.message };
  }
}

async function addWiringItem({ wiring_id, wire_inventory_id, qty }) {
  const t = await sequelize.transaction();

  try {
    // 🔹 Validate input
    if (!wiring_id || !wire_inventory_id || !qty) {
      throw new Error("wiring_id, wire_inventory_id and qty are required");
    }

    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    // 🔹 Check if already exists (unique constraint)
    const existing = await WiringItem.findOne({
      where: { wiring_id, wire_inventory_id },
      transaction: t,
    });

    if (existing) {
      throw new Error("This wire already added to this wiring");
    }

    const inventory = await WireInventory.findByPk(wire_inventory_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!inventory) {
      throw new Error("Wire inventory not found");
    }

    // 🔹 Check stock
    if (inventory.stock < qtyNum) {
      throw new Error("Insufficient stock");
    }

    // 🔹 Deduct stock
    if (inventory.stock - qtyNum < 0) {
      throw new Error("Stock cannot go below zero");
    }
    inventory.stock = inventory.stock - qtyNum;

    await inventory.save({ transaction: t });

    // 🔹 Create wiring item
    const item = await WiringItem.create(
      {
        wiring_id,
        wire_inventory_id,
        qty: qtyNum,
      },
      { transaction: t },
    );

    await t.commit();

    return {
      success: true,
      data: item,
      message: "Wiring item added & stock deducted successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error adding wiring item:", error);

    return {
      success: false,
      message: error.message,
    };
  }
}

async function getIssuedWiresByWiringId(wiring_id) {
  try {
    if (!wiring_id) {
      throw new Error("wiring_id is required");
    }

    // Fetch the wiring itself
    const wiring = await Wiring.findByPk(wiring_id, {
      attributes: ["technician_id", "inventory_status"],
    });

    if (!wiring) {
      return { success: false, message: "Wiring not found" };
    }

    // Fetch all wiring items
    const issuedItems = await WiringItem.findAll({
      where: { wiring_id },
      include: [
        {
          model: WireInventory,
          as: "wire",
          attributes: ["id", "brand_name", "wire_type", "color", "gauge"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // Map wiring items
    const items = issuedItems.map((item) => ({
      id: item.id,
      wiring_id: item.wiring_id,
      wire_inventory_id: item.wire_inventory_id,
      qty: item.qty,
      created_at: item.created_at,
      updated_at: item.updated_at,
      brand_name: item.wire?.brand_name || null,
      wire_type: item.wire?.wire_type || null,
      color: item.wire?.color || null,
      gauge: item.wire?.gauge || null,
    }));

    // Separate extra data
    const extraData = {
      technician_id: wiring.technician_id,
      inventory_status: wiring.inventory_status,
    };

    return { success: true, data: items, extraData };
  } catch (error) {
    console.error("Error fetching issued wires:", error);
    return { success: false, message: error.message };
  }
}

async function updateWiringTechnician(wiringId, technicianId) {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Fetch wiring record
    const wiring = await Wiring.findByPk(wiringId, { transaction: t });
    if (!wiring) {
      await t.rollback();
      return { success: false, message: "Wiring record not found" };
    }

    // 2️⃣ Optional: validate technician exists
    if (technicianId) {
      const tech = await Technician.findByPk(technicianId, { transaction: t });
      if (!tech) {
        await t.rollback();
        return { success: false, message: "Technician not found" };
      }
    }

    // 3️⃣ Update technician_id field
    wiring.technician_id = technicianId;
    await wiring.save({ transaction: t });

    await t.commit();

    return {
      success: true,
      data: wiring,
      message: "Technician updated successfully",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error updating technician:", error);
    return { success: false, message: error.message };
  }
}

async function createCompletionByCustomerId(customerId, transaction = null) {
  const t = transaction || (await sequelize.transaction());
  let external = !!transaction;

  try {
    // 🔹 check existing completion
    const existing = await Cost.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    // ✅ IMPORTANT: just skip, do NOT throw error
    if (existing) {
      return {
        success: true,
        skipped: true,
        message: "Completion already exists",
        data: existing,
      };
    }
    /////////////////
    ///// kit cost
    /////////////

    const kit = await KitReady.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (!kit) {
      throw new Error("Kit not found");
    }

    const kitItems = await KitItems.findAll({
      where: { kit_id: kit.id },
      include: [
        {
          model: Inventory,
          as: "inventory",
          attributes: ["price"],
        },
      ],
      transaction: t,
    });

    if (!kitItems.length) {
      throw new Error("No kit items found");
    }

    let kitCost = 0;

    for (const item of kitItems) {
      kitCost += Number(item.inventory?.price || 0) * Number(item.qty || 0);
    }

    /////////////
    /// wire cost
    ////////

    const wiring = await Wiring.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    let wireCost = 0;

    if (wiring) {
      const wiringItems = await WiringItem.findAll({
        where: { wiring_id: wiring.id },
        include: [
          {
            model: WireInventory,
            as: "wire",
            attributes: ["price"],
          },
        ],
        transaction: t,
      });

      for (const w of wiringItems) {
        wireCost += Number(w.wire?.price || 0) * Number(w.qty || 1);
      }
    }

    const completion = await Cost.create(
      {
        customer_id: customerId,
        kit_cost: kitCost,
        wire_cost: wireCost,
        remarks: "Auto generated",
      },
      { transaction: t },
    );

    if (!external) await t.commit();

    return {
      success: true,
      skipped: false,
      data: completion,
    };
  } catch (error) {
    if (!external) await t.rollback();
    throw error;
  }
}

async function updateWiringInventoryStatus(wiringId, newStatus) {
  const t = await sequelize.transaction();

  try {
    if (!wiringId) {
      throw new Error("wiringId is required");
    }

    const validStatuses = ["pending", "done"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be: ${validStatuses.join(", ")}`);
    }

    const wiring = await Wiring.findByPk(wiringId, { transaction: t });
    if (!wiring) {
      throw new Error("Wiring record not found");
    }

    // ===============================
    // 🔥 WHEN MARKING AS DONE
    // ===============================
    if (newStatus === "done") {
      // ✅ 1. Basic validations
      if (!wiring.technician_id) {
        throw new Error("Technician is not assigned");
      }

      const wiringItemExists = await WiringItem.findOne({
        where: { wiring_id: wiringId },
        transaction: t,
      });

      if (!wiringItemExists) {
        throw new Error("No wiring items found");
      }

      // ✅ 2. Get registration + file generation
      const registration = await CustomerRegistration.findOne({
        where: { customer_id: wiring.customer_id },
        transaction: t,
      });

      if (!registration) {
        throw new Error("Registration not found");
      }

      const fileGen = await FileGeneration.findOne({
        where: { registration_id: registration.id },
        transaction: t,
      });

      if (!fileGen) {
        throw new Error("File generation not found");
      }

      // ===============================
      // 🔹 3. CALCULATE FINAL QTY (IMPORTANT FIX)
      // ===============================
      const PANEL_CATEGORY = 1;
      const INVERTER_CATEGORY = 3;

      const unusedItems = await UnusedInventory.findAll({
        where: {
          customer_id: wiring.customer_id,
          status: "pending",
        },
        include: [
          {
            model: Inventory,
            as: "inventory", // ✅ MUST MATCH alias

            attributes: ["id", "category_id"],
          },
        ],
        transaction: t,
      });

      let unusedPanelQty = 0;
      let unusedInverterQty = 0;

      for (const item of unusedItems) {
        const categoryId = item.inventory?.category_id;
        console.log(categoryId);

        if (categoryId === PANEL_CATEGORY) {
          unusedPanelQty += item.unused_qty;
        }

        if (categoryId === INVERTER_CATEGORY) {
          unusedInverterQty += item.unused_qty;
        }
      }

      let panelQty = (fileGen.panel_quantity || 0) - unusedPanelQty;
      let inverterQty = (fileGen.inverter_quantity || 0) - unusedInverterQty;

      if (panelQty < 0 || inverterQty < 0) {
        throw new Error("Unused qty exceeds actual quantity");
      }

      if (panelQty === 0 && inverterQty === 0) {
        throw new Error("Panel and inverter quantity is zero after adjustment");
      }

      // ===============================
      // 🔹 4. GENERATE DOCS
      // ===============================
      const docs = [];

      for (let i = 1; i <= panelQty; i++) {
        docs.push({ wiring_id: wiringId, doc_name: `Panel ${i}` });
      }

      for (let i = 1; i <= inverterQty; i++) {
        docs.push({ wiring_id: wiringId, doc_name: `Inverter ${i}` });
      }

      docs.push(
        { wiring_id: wiringId, doc_name: "Geo Tag" },
        { wiring_id: wiringId, doc_name: "Site Photo" },
        { wiring_id: wiringId, doc_name: "Wiring File" },
      );

      await WiringDocs.bulkCreate(docs, {
        transaction: t,
        ignoreDuplicates: true,
      });

      // ===============================
      // 🔹 5. HANDLE UNUSED INVENTORY
      // ===============================
      for (const item of unusedItems) {
        const kitItem = await KitItems.findByPk(item.kit_item_id, {
          transaction: t,
        });

        if (kitItem && item.unused_qty > kitItem.qty) {
          throw new Error("Unused qty exceeds kit item qty");
        }

        // ➕ Add back to inventory
        await Inventory.increment("qty", {
          by: item.unused_qty,
          where: { id: item.inventory_id },
          transaction: t,
        });

        // ➖ Reduce from kit
        if (kitItem) {
          await kitItem.update(
            { qty: kitItem.qty - item.unused_qty },
            { transaction: t },
          );
        }

        // ✅ mark processed
        await item.update({ status: "done" }, { transaction: t });
      }

      await fileGen.update(
        {
          panel_quantity: panelQty,
          inverter_quantity: inverterQty,
        },
        { transaction: t },
      );
    }
    console.log("here kdj kjlk sdf", wiring.customer_id);
    const completionResult = await createCompletionByCustomerId(
      wiring.customer_id,
      t,
    );

    if (!completionResult?.success) {
      throw new Error(
        completionResult?.message || "Completion creation failed",
      );
    }

    // ===============================
    // 🔹 FINAL STATUS UPDATE
    // ===============================
    wiring.inventory_status = newStatus;
    await wiring.save({ transaction: t });

    await t.commit();

    return {
      success: true,
      data: wiring,
      message: "Inventory status updated successfully",
    };
  } catch (error) {
    await t.rollback();

    console.error("❌ Error:", error);

    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
}

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

async function getWiringDocsByWiringId(wiringId) {
  try {
    if (!wiringId) {
      throw new Error("wiringId is required");
    }

    const docs = await WiringDocs.findAll({
      where: { wiring_id: wiringId },
      attributes: ["id", "doc_name", "doc_link", "created_at", "updated_at"],
      order: [["id", "ASC"]],
    });

    if (!docs || docs.length === 0) {
      return {
        success: false,
        message: "No wiring documents found",
        data: [],
      };
    }

    return {
      success: true,
      count: docs.length,
      data: docs,
    };
  } catch (error) {
    console.error("❌ Error fetching wiring docs:", error);
    throw error;
  }
}

const findFileInFolder = async (fileName, folderId) => {
  try {
    const res = await drive.files.list({
      q: `name = '${fileName}' and '${folderId}' in parents and trashed = false`,
      fields: "files(id, name, webViewLink)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return res.data.files.length > 0 ? res.data.files[0] : null;
  } catch (error) {
    console.error("❌ Error finding file:", error.message);
    throw error;
  }
};

async function uploadWiringDoc(customerId, wiringDocId, file) {
  try {
    if (!customerId || !wiringDocId || !file) {
      throw new Error("customerId, wiringDocId and file are required");
    }

    // 🔹 Step 1: Get folder
    const customerDoc = await CustomerDocument.findOne({
      where: { customer_id: customerId },
    });

    if (!customerDoc || !customerDoc.folder_id) {
      throw new Error("Customer folder not found");
    }

    const folderId = customerDoc.folder_id;

    // 🔹 Step 2: Get wiring doc
    const wiringDoc = await WiringDocs.findOne({
      where: { id: wiringDocId },
    });

    if (!wiringDoc) {
      throw new Error("Wiring doc not found");
    }

    const fileName = wiringDoc.doc_name; // 🔥 important

    // 🔹 Step 3: Check existing file
    const existingFile = await findFileInFolder(fileName, folderId);

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
      // 📤 Upload new
      response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: file.mimetype || "application/octet-stream",
          body: Readable.from(file.buffer),
        },
        supportsAllDrives: true,
        fields: "id, webViewLink",
      });
    }

    // 🔹 Step 4: Save in DB
    await WiringDocs.update(
      {
        doc_link: response.data.webViewLink,
        updated_at: new Date(),
      },
      {
        where: { id: wiringDocId },
      },
    );

    return {
      success: true,
      message: "Wiring document uploaded successfully",
      data: {
        doc_name: fileName,
        url: response.data.webViewLink,
        fileId: response.data.id,
      },
    };
  } catch (error) {
    console.error("❌ Wiring Doc Upload Error:", error.message);
    throw error;
  }
}

async function moveToFinalStage(customerId, leadId) {
  const t = await sequelize.transaction();

  try {
    if (!customerId || !leadId) {
      throw new Error("customerId is required");
    }

    // 🔹 Step 1: Complete stage 9
    await CustomerStage.update(
      {
        status: "done",
        completed_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: {
          customer_id: customerId,
          stage_id: 9,
        },
        transaction: t,
      },
    );

    // 🔹 Step 2: Start stage 10
    await CustomerStage.update(
      {
        status: "pending",
        started_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: {
          customer_id: customerId,
          stage_id: 10,
        },
        transaction: t,
      },
    );

    // 🔹 Step 3: Ensure final_stage record exists
    await FinalStage.findOrCreate({
      where: { customer_id: customerId },
      defaults: {
        customer_id: customerId,
        created_at: new Date(),
      },
      transaction: t,
    });

    // 🔴 Step 4: Update wiring status
    const wiringUpdated = await Wiring.update(
      {
        status: "done",
        updated_at: new Date(),
      },
      {
        where: { customer_id: customerId },
        transaction: t,
      },
    );

    // Optional check
    if (wiringUpdated[0] === 0) {
      throw new Error("No wiring record found for this customer");
    }

    const leadData = await Lead.findByPk(leadId, { transaction: t });

    if (!leadData) {
      throw new Error("Lead not found");
    }

    const { source_id, installation_type } = leadData;

    // 🔹 Get Customer Registration
    const registration = await CustomerRegistration.findOne({
      where: { customer_id: customerId },
      transaction: t,
    });

    if (!registration) {
      throw new Error("Customer registration not found");
    }

    // 🔹 Get File Generation (system capacity)
    const fileGen = await FileGeneration.findOne({
      where: { registration_id: registration.id },
      transaction: t,
    });

    if (!fileGen) {
      throw new Error("File generation not found");
    }

    const total_kw = fileGen.system_capacity;

    // 🔹 Insert Commission
    await Commission.create(
      {
        customer_id: customerId,
        source_id: source_id,
        total_kw: total_kw / 1000,
        type: installation_type,
        status: "pending",
        created_at: new Date(),
      },
      { transaction: t },
    );

    await t.commit();

    return {
      success: true,
      message: "Moved to final stage and wiring marked as done",
    };
  } catch (error) {
    await t.rollback();
    console.error("❌ Error moving to final stage:", error);

    throw error;
  }
}

async function getWiringCustomerDetailsById(technicianId) {
  try {
    const wirings = await Wiring.findAll({
      where: {
        technician_id: technicianId, // 👈 filter here
      },
      attributes: [
        "id",
        "customer_id",
        "technician_id",
        "status",
        "inventory_status",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: Customer,
          as: "customerForWiring",
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
        {
          model: Technician,
          as: "technician",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return wirings.map((w) => ({
      wiring_id: w.id,
      wiring_inv_status: w.inventory_status,
      wiring_status: w.status,
      customer_id: w.customer_id,
      lead_id: w.customerForWiring?.lead?.id || null,
      customer_name: w.customerForWiring?.lead?.customer_name || null,
      contact_number: w.customerForWiring?.lead?.contact_number || null,
      address: w.customerForWiring?.lead?.address || null,
      technician_id: w.technician_id,
      technician_name: w.technician?.name || null,
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching wiring customer details:", error);
    throw error;
  }
}

async function getFabricationDetailsById(fabricatorId) {
  try {
    if (!fabricatorId) {
      throw new Error("fabricatorId is required");
    }

    const fabrications = await Fabrication.findAll({
      where: {
        fabricator_id: fabricatorId,
      },
      attributes: [
        "id",
        "customer_id",
        "fabricator_id",
        "status",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: Customer,
          as: "customer", // 👈 ensure alias matches
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
        {
          model: Fabricator,
          as: "fabricator", // 👈 ensure alias matches
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // 🔹 Format response
    return fabrications.map((f) => ({
      fabrication_id: f.id,
      fabrication_status: f.status,
      customer_id: f.customer_id,

      lead_id: f.customer?.lead?.id || null,
      customer_name: f.customer?.lead?.customer_name || null,
      contact_number: f.customer?.lead?.contact_number || null,
      address: f.customer?.lead?.address || null,

      fabricator_id: f.fabricator_id,
      fabricator_name: f.fabricator?.name || null,

      created_at: f.created_at,
      updated_at: f.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching fabrication details:", error);
    throw error;
  }
}
async function getPendingCommissions() {
  try {
    const commissions = await Commission.findAll({
      where: {
        status: "pending",
      },

      attributes: [
        "id",
        "total_kw",
        "type",
        "commission",
        "status",
        "created_at",
      ],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number", "source_id"],
            },
          ],
        },

        {
          model: Source,
          as: "source",
          attributes: [
            "id",
            "name",
            "residential_commission",
            "commercial_commission",
          ],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    // 🔥 Compute commission dynamically
    const result = commissions.map((item) => {
      const type = item.type;
      let rate = 0;

      if (type === "Residential") {
        rate = item.source?.residential_commission;
      } else if (type === "Industrial") {
        rate = item.source?.commercial_commission;
      } else if (type === "Commercial") {
        rate = item.source?.commercial_commission;
      }
      return {
        id: item.id,
        total_kw: item.total_kw,
        type: item.type,
        commission: item.commission,
        status: item.status,
        created_at: item.created_at,

        customer_name: item.customer?.lead?.customer_name,
        mobile: item.customer?.lead?.contact_number,
        source_name: item.source?.name,

        // 🔥 ONLY ONE COMMISSION (calculated)
        commission_per_kw: Number(rate),
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching commissions:", error);
    throw error;
  }
}

async function getPendingSupervisorCommissions() {
  try {
    const commissions = await SupervisorCommission.findAll({
      where: {
        status: "pending",
      },

      attributes: [
        "id",
        "total_kw",
        "type",
        "commission",
        "status",
        "created_at",
      ],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number", "source_id"],
            },
          ],
        },

        {
          model: Supervisor,
          as: "supervisor",
          attributes: [
            "id",
            "name",
            "residential_commission",
            "commercial_commission",
          ],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    // 🔥 Compute commission dynamically
    const result = commissions.map((item) => {
      const type = item.type;
      let rate = 0;

      if (type === "Residential") {
        rate = item.supervisor?.residential_commission;
      } else if (type === "Industrial") {
        rate = item.supervisor?.commercial_commission;
      } else if (type === "Commercial") {
        rate = item.supervisor?.commercial_commission;
      }
      return {
        id: item.id,
        total_kw: item.total_kw,
        type: item.type,
        commission: item.commission,
        status: item.status,
        created_at: item.created_at,

        customer_name: item.customer?.lead?.customer_name,
        mobile: item.customer?.lead?.contact_number,
        source_name: item.supervisor?.name,

        // 🔥 ONLY ONE COMMISSION (calculated)
        commission_per_kw: Number(rate),
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching commissions:", error);
    throw error;
  }
}

async function getPendingFabricatorCommissions() {
  try {
    const commissions = await FabricatorCommission.findAll({
      where: {
        status: "pending",
      },

      attributes: ["id", "total_kw", "commission", "status", "created_at"],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number", "source_id"],
            },
          ],
        },

        {
          model: Fabricator,
          as: "fabricator",
          attributes: ["id", "name", "commission_rate"],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    // 🔥 compute rate dynamically
    const result = commissions.map((item) => {
      let rate = item.fabricator?.commission_rate;
      return {
        id: item.id,
        total_kw: item.total_kw,
        commission: item.commission,
        status: item.status,
        created_at: item.created_at,

        customer_name: item.customer?.lead?.customer_name,
        mobile: item.customer?.lead?.contact_number,
        fabricator_name: item.fabricator?.name,

        commission_per_kw: Number(rate),
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching fabricator commissions:", error);
    throw error;
  }
}

async function updateCommissionById(id, commission, status) {
  try {
    if (!id) {
      throw new Error("Commission ID is required");
    }

    // Optional validation
    const allowedStatus = ["pending", "approved", "paid"];
    if (status && !allowedStatus.includes(status)) {
      throw new Error("Invalid status value");
    }

    const [updatedRows] = await Commission.update(
      {
        ...(commission !== undefined && { commission }),
        ...(status && { status }),
      },
      {
        where: { id },
      },
    );

    if (updatedRows === 0) {
      throw new Error("Commission not found or no changes made");
    }

    // 🔹 Fetch updated record (optional but useful)
    const updatedCommission = await Commission.findByPk(id);

    return {
      success: true,
      message: "Commission updated successfully",
      data: updatedCommission,
    };
  } catch (error) {
    console.error("❌ Error updating commission:", error);
    throw error;
  }
}

async function updateSupervisorCommissionById(id, commission, status) {
  try {
    if (!id) {
      throw new Error("Commission ID is required");
    }

    // Optional validation
    const allowedStatus = ["pending", "approved", "paid"];
    if (status && !allowedStatus.includes(status)) {
      throw new Error("Invalid status value");
    }

    const [updatedRows] = await SupervisorCommission.update(
      {
        ...(commission !== undefined && { commission }),
        ...(status && { status }),
      },
      {
        where: { id },
      },
    );

    if (updatedRows === 0) {
      throw new Error("Commission not found or no changes made");
    }

    // 🔹 Fetch updated record (optional but useful)
    const updatedCommission = await SupervisorCommission.findByPk(id);

    return {
      success: true,
      message: "Commission updated successfully",
      data: updatedCommission,
    };
  } catch (error) {
    console.error("❌ Error updating commission:", error);
    throw error;
  }
}

async function updateFabricatorCommissionById(id, commission, status) {
  try {
    if (!id) {
      throw new Error("Commission ID is required");
    }

    // Optional validation
    const allowedStatus = ["pending", "approved", "paid"];
    if (status && !allowedStatus.includes(status)) {
      throw new Error("Invalid status value");
    }

    const [updatedRows] = await FabricatorCommission.update(
      {
        ...(commission !== undefined && { commission }),
        ...(status && { status }),
      },
      {
        where: { id },
      },
    );

    if (updatedRows === 0) {
      throw new Error("Commission not found or no changes made");
    }

    // 🔹 Fetch updated record (optional but useful)
    const updatedCommission = await FabricatorCommission.findByPk(id);

    return {
      success: true,
      message: "Commission updated successfully",
      data: updatedCommission,
    };
  } catch (error) {
    console.error("❌ Error updating commission:", error);
    throw error;
  }
}

async function getCommissionsByStatus(status) {
  try {
    if (!status) {
      throw new Error("Status is required");
    }

    const allowedStatus = ["pending", "approved", "paid"];
    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid status value");
    }

    const commissions = await Commission.findAll({
      where: {
        status: status,
      },

      attributes: [
        "id",
        "total_kw",
        "type",
        "commission",
        "status",
        "created_at",
      ],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number"],
            },
          ],
        },
        {
          model: Source,
          as: "source",
          attributes: [
            "id",
            "name",
            "residential_commission",
            "commercial_commission",
          ],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    const result = commissions.map((item) => {
      let rate = 0;

      if (item.type === "Residential") {
        rate = item.source?.residential_commission;
      } else if (item.type === "Commercial") {
        rate = item.source?.commercial_commission;
      } else if (item.type === "Industrial") {
        rate = item.source?.commercial_commission || 0;
      }

      return {
        id: item.id,
        total_kw: item.total_kw,
        type: item.type,
        status: item.status,
        created_at: item.created_at,
        commission: item.commission,

        customer_name: item.customer?.lead?.customer_name,
        mobile: item.customer?.lead?.contact_number,
        source_name: item.source?.name,
        commission_per_kw: Number(rate),
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching commissions by status:", error);
    throw error;
  }
}

async function getSupervisorCommissionsByStatus(status) {
  try {
    if (!status) {
      throw new Error("Status is required");
    }

    const allowedStatus = ["pending", "approved", "paid"];
    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid status value");
    }

    const commissions = await SupervisorCommission.findAll({
      where: { status },

      attributes: [
        "id",
        "total_kw",
        "type",
        "commission",
        "status",
        "created_at",
      ],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number"],
            },
          ],
        },
        {
          model: Supervisor,
          as: "supervisor",
          attributes: [
            "id",
            "name",
            "residential_commission",
            "commercial_commission",
          ],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    const result = commissions.map((item) => {
      let rate = 0;

      if (item.type === "Residential") {
        rate = item.supervisor?.residential_commission;
      } else if (item.type === "Commercial") {
        rate = item.supervisor?.commercial_commission;
      } else if (item.type === "Industrial") {
        rate = item.supervisor?.commercial_commission || 0;
      }

      return {
        id: item.id,
        total_kw: item.total_kw,
        type: item.type,
        status: item.status,
        created_at: item.created_at,
        commission: item.commission,

        customer_name: item.customer?.lead?.customer_name,
        mobile: item.customer?.lead?.contact_number,
        source_name: item.supervisor?.name, // ✅ fixed naming
        commission_per_kw: Number(rate),
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching commissions by status:", error);
    throw error;
  }
}

async function getFabricatorCommissionsByStatus(status) {
  try {
    if (!status) {
      throw new Error("Status is required");
    }

    const allowedStatus = ["pending", "approved", "paid"];
    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid status value");
    }

    const commissions = await FabricatorCommission.findAll({
      where: { status },

      attributes: ["id", "total_kw", "commission", "status", "created_at"],

      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["customer_name", "contact_number"],
            },
          ],
        },

        {
          model: Fabricator,
          as: "fabricator",
          attributes: ["id", "name", "commission_rate"],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    const result = commissions.map((item) => {
      let rate = item.fabricator?.commission_rate;

      return {
        id: item.id,
        total_kw: item.total_kw,
        status: item.status,
        created_at: item.created_at,
        commission: item.commission,

        customer_name: item.customer?.lead?.customer_name,
        mobile: item.customer?.lead?.contact_number,
        fabricator_name: item.fabricator?.name,

        commission_per_kw: Number(rate),
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching fabricator commissions:", error);
    throw error;
  }
}

async function getWiringCustomerDetailsByStatus(status) {
  try {
    if (!status) {
      throw new Error("status is required");
    }

    const validStatuses = ["pending", "done"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status. Must be pending or done");
    }

    const wirings = await Wiring.findAll({
      where: { status },

      attributes: [
        "id",
        "customer_id",
        "technician_id",
        "status",
        "inventory_status",
        "created_at",
        "updated_at",
      ],

      include: [
        {
          model: Customer,
          as: "customerForWiring",
          attributes: ["id", "lead_id"],
          include: [
            {
              model: Lead,
              as: "lead",
              attributes: ["id", "customer_name", "contact_number", "address"],
            },
          ],
        },
        {
          model: Technician,
          as: "technician",
          attributes: ["id", "name"],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    if (!wirings || wirings.length === 0) {
      return [];
    }

    // 🔹 format response
    return wirings.map((w) => ({
      wiring_id: w.id,
      wiring_inv_status: w.inventory_status,
      wiring_status: w.status,
      customer_id: w.customer_id,
      lead_id: w.customerForWiring?.lead?.id || null,
      customer_name: w.customerForWiring?.lead?.customer_name || null,
      contact_number: w.customerForWiring?.lead?.contact_number || null,
      address: w.customerForWiring?.lead?.address || null,
      technician_id: w.technician_id,
      technician_name: w.technician?.name || null,
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));
  } catch (error) {
    throw error;
  }
}
async function getWiringItemsByCustomerId(customerId) {
  try {
    if (!customerId) {
      throw new Error("customerId is required");
    }

    // 🔹 get wiring with technician
    const wiring = await Wiring.findOne({
      where: { customer_id: customerId },
      attributes: [
        "id",
        "customer_id",
        "status",
        "technician_id",
        "created_at",
      ],
      include: [
        {
          model: Technician,
          as: "technician",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!wiring) {
      return null;
    }

    // 🔹 get wiring items
    const items = await WiringItem.findAll({
      where: { wiring_id: wiring.id },
      attributes: ["id", "wire_inventory_id", "qty"],
      include: [
        {
          model: WireInventory,
          as: "wire",
          attributes: [
            "id",
            "brand_name",
            "wire_type",
            "color",
            "gauge",
            "price",
          ],
        },
      ],
    });

    return {
      wiring_id: wiring.id,
      customer_id: wiring.customer_id,
      status: wiring.status,

      technician_id: wiring.technician_id,
      technician_name: wiring.technician?.name || null,

      items: items.map((i) => ({
        wiring_item_id: i.id,
        wire_inventory_id: i.wire_inventory_id,
        name: i.wire?.brand_name || null,
        wire_type: i.wire?.wire_type || null,
        color: i.wire?.color || null,
        gauge: i.wire?.gauge || null,
        qty: i.qty,
      })),
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  updateTechnician,
  addTechnician,
  getAllTechnicians,
  getWiringCustomerDetails,
  addWireInventory,
  getAllWireInventory,
  updateWireInventoryById,
  getAvailableWireInventoryForWiring,
  addWiringItem,
  getIssuedWiresByWiringId,
  updateWiringTechnician,
  updateWiringInventoryStatus,
  getWiringDocsByWiringId,
  uploadWiringDoc,
  moveToFinalStage,
  getWiringCustomerDetailsById,
  getFabricationDetailsById,
  getPendingCommissions,
  updateCommissionById,
  getCommissionsByStatus,
  getWiringCustomerDetailsByStatus,
  getWiringItemsByCustomerId,
  getPendingSupervisorCommissions,
  updateSupervisorCommissionById,
  getSupervisorCommissionsByStatus,
  getPendingFabricatorCommissions,
  updateFabricatorCommissionById,
  getFabricatorCommissionsByStatus,
};
