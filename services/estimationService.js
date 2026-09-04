const sequelize = require("../config/db");
const { AgencyInventory } = require("../models/agencyInventoryModel");
const { Agency } = require("../models/agencyModel");
const { Brand } = require("../models/brandModel");
const { Estimation } = require("../models/estimationModel");
const { EstimationType } = require("../models/estimationTypeModel");
const { Inventory } = require("../models/inventoryModel");
const { Inverter } = require("../models/inverterModel");
const { Op } = require("sequelize");

async function getEstimations() {
  try {
    const estimations = await Estimation.findAll({
      attributes: ["id", "type_id", "name", "qty", "price", "gst"],
      include: [
        {
          model: EstimationType,
          as: "type",
          attributes: ["id", "name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    return estimations;
  } catch (error) {
    throw error;
  }
}

async function getEstimationTypes() {
  try {
    const estimationTypes = await EstimationType.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return estimationTypes;
  } catch (error) {
    throw error;
  }
}

async function addEstimation(data) {
  try {
    const { type_id, name, qty, price, gst } = data;

    // Check estimation type exists
    const estimationType = await EstimationType.findByPk(type_id);

    if (!estimationType) {
      throw new Error("Estimation type not found");
    }

    const estimation = await Estimation.create({
      type_id,
      name,
      qty,
      price,
      gst,
    });

    return estimation;
  } catch (error) {
    throw error;
  }
}

async function updateEstimation(id, data) {
  try {
    const { type_id, name, qty, price, gst } = data;
    const estimation = await Estimation.findByPk(id);

    if (!estimation) {
      throw new Error("Estimation not found");
    }

    // Check estimation type exists
    if (type_id !== undefined) {
      const estimationType = await EstimationType.findByPk(type_id);

      if (!estimationType) {
        throw new Error("Estimation type not found");
      }
    }

    await estimation.update({
      type_id,
      name,
      qty,
      price,
      gst,
    });

    return estimation;
  } catch (error) {
    throw error;
  }
}

async function generateEstimation(data) {
  try {
    const { panel_qty, panel_wattage, panel_rate_per_watt, inverter_wattage } =
      data;

    // --------------------------------
    // Validate input
    // --------------------------------
    if (!panel_qty || panel_qty <= 0) {
      throw new Error("Panel quantity is required");
    }

    if (!panel_wattage || panel_wattage <= 0) {
      throw new Error("Panel wattage is required");
    }

    if (
      panel_rate_per_watt === undefined ||
      panel_rate_per_watt === null ||
      panel_rate_per_watt < 0
    ) {
      throw new Error("Panel rate per watt is required");
    }

    // --------------------------------
    // Find inverter price
    // --------------------------------
    const inverter = await Inverter.findOne({
      where: {
        kw: inverter_wattage,
      },
      attributes: ["price"],
    });

    if (!inverter) {
      throw new Error(`Inverter price not found for ${inverter_wattage} kW`);
    }

    const inverterPrice = Number(inverter.price);

    // --------------------------------
    // Calculate total system capacity
    // --------------------------------
    const total_kw = (panel_qty * panel_wattage) / 1000;

    // --------------------------------
    // Get all estimation master data
    // --------------------------------
    const estimations = await Estimation.findAll({
      attributes: ["id", "type_id", "name", "qty", "price", "gst"],
      include: [
        {
          model: EstimationType,
          as: "type",
          attributes: ["id", "name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    if (!estimations.length) {
      throw new Error("No estimation items found");
    }

    // --------------------------------
    // Calculate every item
    // --------------------------------
    const items = estimations.map((item) => {
      const itemName = item.name.trim().toUpperCase();

      let qty = Number(item.qty);
      let price = Number(item.price);
      // --------------------------------
      // PANEL
      // --------------------------------
      if (itemName === "PANEL") {
        qty = panel_qty;

        price = panel_wattage * panel_rate_per_watt;

        const amount = qty * price;

        const gstAmount = (amount * Number(item.gst)) / 100;

        return {
          id: item.id,
          type_id: item.type_id,
          type: item.type?.name || null,
          name: item.name,
          qty,
          price,
          gst: Number(item.gst),
          amount,
          gst_amount: gstAmount,
          total: amount + gstAmount,
        };
      }

      // --------------------------------
      // INVERTER
      // --------------------------------
      if (itemName === "INVERTER") {
        price = inverterPrice;
      }

      // --------------------------------
      // 40*60 HOT DIP
      // --------------------------------
      if (itemName.includes("40*60")) {
        qty = panel_qty;
      }

      // --------------------------------
      // J BOLT
      // --------------------------------
      else if (itemName === "J BOLT") {
        qty = panel_qty * 4;
      }

      // --------------------------------
      // LABOUR CHARGE
      // --------------------------------
      else if (
        itemName === "LABOUR CHARGE" ||
        itemName === "WIRING LABOUR" ||
        itemName === "FILE CHARGE" ||
        itemName == "PORTAL CHARGE" ||
        itemName == "SALESMAN CHARGE"
      ) {
        qty = total_kw;
      }
      const amount = qty * price;

      const gstAmount = (amount * Number(item.gst)) / 100;
      return {
        id: item.id,
        type_id: item.type_id,
        type: item.type?.name || null,
        name: item.name,
        qty,
        price,
        gst: Number(item.gst),
        amount,
        gst_amount: gstAmount,
        total: amount + gstAmount,
      };
    });

    // --------------------------------
    // Calculate totals
    // --------------------------------
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    const total_gst = items.reduce((sum, item) => sum + item.gst_amount, 0);

    const grand_total = subtotal + total_gst;

    return {
      panel_qty,
      panel_wattage,
      panel_rate_per_watt,
      total_kw,
      discount: 10000,
      subsidy_amount: 78000,
      items,

      subtotal,
      total_gst,
      grand_total,
    };
  } catch (error) {
    throw error;
  }
}
async function getInverters() {
  try {
    const inverters = await Inverter.findAll({
      attributes: ["id", "kw", "price"],
      order: [["kw", "ASC"]],
    });

    return inverters;
  } catch (error) {
    throw error;
  }
}

async function addInverter(data) {
  try {
    const { kw, price } = data;

    if (kw === undefined || kw === null) {
      throw new Error("KW is required");
    }

    if (price === undefined || price === null) {
      throw new Error("Price is required");
    }

    const inverter = await Inverter.create({
      kw,
      price,
    });

    return inverter;
  } catch (error) {
    throw error;
  }
}

async function updateInverter(id, data) {
  try {
    const { kw, price } = data;

    const inverter = await Inverter.findByPk(id);

    if (!inverter) {
      throw new Error("Inverter not found");
    }

    await inverter.update({
      kw,
      price,
    });

    return inverter;
  } catch (error) {
    throw error;
  }
}

async function deleteEstimation(id) {
  try {
    const estimation = await Estimation.findByPk(id);

    if (!estimation) {
      throw new Error("Estimation not found");
    }

    await estimation.destroy();

    return {
      success: true,
      message: "Estimation deleted successfully",
      id,
    };
  } catch (error) {
    console.error("❌ Error deleting estimation:", error);
    throw error;
  }
}

async function addAgency(data) {
  try {
    const { name } = data;

    if (!name) {
      throw new Error("Agency name is required");
    }

    const existing = await Agency.findOne({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("name")),
            name.trim().toLowerCase(),
          ),
        ],
      },
    });

    if (existing) {
      throw new Error("Agency already exists");
    }

    const agency = await Agency.create({
      name: name.trim().toUpperCase(),
    });

    return agency;
  } catch (error) {
    throw error;
  }
}

async function updateAgency(id, data) {
  try {
    const { name } = data;

    if (!id) {
      throw new Error("Agency id is required");
    }

    if (!name) {
      throw new Error("Agency name is required");
    }

    const agency = await Agency.findByPk(id);

    if (!agency) {
      throw new Error("Agency not found");
    }

    const existing = await Agency.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        name.trim().toLowerCase(),
      ),
    });

    if (existing && existing.id !== Number(id)) {
      throw new Error("Agency already exists");
    }

    await agency.update({
      name: name.trim().toUpperCase(),
    });

    return agency;
  } catch (error) {
    throw error;
  }
}

async function deleteAgency(id) {
  try {
    // 🔹 Validate
    if (!id) {
      throw new Error("Agency id is required");
    }

    // 🔹 Check agency exists
    const agency = await Agency.findByPk(id);

    if (!agency) {
      throw new Error("Agency not found");
    }

    // 🔹 Delete agency
    await agency.destroy();

    return true;
  } catch (error) {
    throw error;
  }
}

async function getAllAgencies() {
  try {
    const agencies = await Agency.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    return agencies;
  } catch (error) {
    throw error;
  }
}
async function createAgencyInventory(data) {
  try {
    const { agency_id, inventory_id, qty, note } = data;

    // Validate agency
    if (!agency_id) {
      throw new Error("Agency id is required");
    }

    // Validate inventory
    if (!inventory_id) {
      throw new Error("Inventory id is required");
    }

    // Validate quantity
    if (qty === undefined || qty === null || qty === "") {
      throw new Error("Quantity is required");
    }

    if (Number(qty) <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Check agency exists
    const agency = await Agency.findByPk(agency_id);

    if (!agency) {
      throw new Error("Agency not found");
    }

    // Check inventory exists
    const inventory = await Inventory.findByPk(inventory_id);

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    // Check available stock
    if (Number(inventory.qty) < Number(qty)) {
      throw new Error(
        `Insufficient stock. Available quantity: ${inventory.qty}`,
      );
    }

    // Create agency inventory entry
    const agencyInventory = await AgencyInventory.create({
      agency_id,
      inventory_id,
      qty: Number(qty),
      note: note ? note.trim() : null,
    });

    // Reduce main inventory stock
    await inventory.update({
      qty: Number(inventory.qty) - Number(qty),
    });

    return agencyInventory;
  } catch (error) {
    throw error;
  }
}

const getAllAgencyInventory = async () => {
  try {
    const data = await AgencyInventory.findAll({
      order: [["created_at", "DESC"]],

      include: [
        {
          model: Agency,
          as: "agency",
          attributes: ["id", "name"],
        },

        {
          model: Inventory,
          as: "inventory",
          attributes: [
            "id",
            "name",
            "brand_id",
            "category_id",
            "qty",
            "price",
            "wattage",
            "tax",
          ],

          include: [
            {
              model: Brand,
              as: "brand",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    return data.map((item) => ({
      id: item.id,

      agency_id: item.agency_id,
      agency_name: item.agency?.name || "Unknown Agency",

      inventory_id: item.inventory_id,
      inventory_name: item.inventory?.name || "Unknown Inventory",

      brand_name: item.inventory?.brand?.name || "Generic",

      qty: item.qty,

      note: item.note || "",

      created_at: item.created_at,
    }));
  } catch (error) {
    console.error("getAllAgencyInventory service error:", error);
    throw error;
  }
};

module.exports = {
  getEstimations,
  getEstimationTypes,
  addEstimation,
  updateEstimation,
  generateEstimation,
  getInverters,
  addInverter,
  updateInverter,
  deleteEstimation,
  addAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies,
  createAgencyInventory,
  getAllAgencyInventory,
};
