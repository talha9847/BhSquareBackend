const sequelize = require("../config/db");
const { Customer } = require("../models/customerModel");
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { Lead } = require("../models/leadModel");
const { Technician } = require("../models/technicianModel");
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

async function updateWiringAndDecrementInventory(wiringId, wiringData) {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Fetch the wiring record
    const wiring = await Wiring.findByPk(wiringId, { transaction: t });
    if (!wiring) throw new Error("Wiring record not found");

    // 2️⃣ Map wiring fields to inventory IDs
    const inventoryMap = {
      ac_wire_red: 13, // Replace with actual inventory_id
      ac_wire_black: 14,
      dc_wire_red: 15,
      dc_wire_black: 16,
      conduit_pipe: 17,
      la_wire: 18,
      earthing: 19,
    };

    // 3️⃣ Check inventory availability and decrement
    for (const [key, value] of Object.entries(inventoryMap)) {
      const qtyToDeduct = parseInt(wiringData[key] || 0, 10);
      if (qtyToDeduct > 0) {
        const item = await Inventory.findByPk(value, { transaction: t });
        if (!item) throw new Error(`Inventory item ${key} not found`);
        if (item.quantity < qtyToDeduct) {
          throw new Error(`Not enough inventory for ${key}`);
        }
        item.quantity -= qtyToDeduct;
        await item.save({ transaction: t });
      }
    }

    // 4️⃣ Update wiring table with provided quantities
    Object.keys(inventoryMap).forEach((key) => {
      if (wiringData[key] !== undefined) wiring[key] = wiringData[key];
    });

    if (wiringData.technician_id) {
      wiring.technician_id = wiringData.technician_id;
    }

    // ✅ Update inventory_status to 'done'
    wiring.inventory_status = "done";

    await wiring.save({ transaction: t });
    await t.commit();

    return {
      success: true,
      message: "Wiring updated and inventory decremented",
    };
  } catch (error) {
    await t.rollback();
    console.error("Error updating wiring and inventory:", error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  updateTechnician,
  addTechnician,
  getAllTechnicians,
  getWiringCustomerDetails,
  updateWiringAndDecrementInventory,
};
