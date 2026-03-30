const sequelize = require("../config/db");
const { Customer } = require("../models/customerModel");
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { Lead } = require("../models/leadModel");
const { Technician } = require("../models/technicianModel");
const { WireInventory } = require("../models/wireInventoryModel");
const { WiringItem } = require("../models/wiringItemModel");
const { Wiring } = require("../models/wiringModel");

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
              attributes: ["customer_name", "contact_number", "address"],
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
      { brand_name, wire_type, color, gauge, stock },
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
    const { brand_name, wire_type, color, gauge, stock } = updateData;
    console.log(stock);

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

async function updateWiringInventoryStatus(wiringId, newStatus) {
  const t = await sequelize.transaction();
  try {
    if (!wiringId) {
      throw new Error("wiringId is required");
    }

    const validStatuses = ["pending", "done"]; // adjust as needed
    if (!validStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const wiring = await Wiring.findByPk(wiringId, { transaction: t });
    if (!wiring) {
      await t.rollback();
      return { success: false, message: "Wiring record not found" };
    }

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
    console.error("Error updating wiring inventory_status:", error);
    return { success: false, message: error.message };
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
};
