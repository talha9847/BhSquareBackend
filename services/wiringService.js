const sequelize = require("../config/db");
const { Customer } = require("../models/customerModel");
const { Inventory } = require("../models/inventoryModel");
const { KitItems } = require("../models/kitItemsModels");
const { Lead } = require("../models/leadModel");
const { Technician } = require("../models/technicianModel");
const { WireInventory } = require("../models/wireInventoryModel");
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

module.exports = {
  updateTechnician,
  addTechnician,
  getAllTechnicians,
  getWiringCustomerDetails,
  addWireInventory,
  getAllWireInventory,
};
