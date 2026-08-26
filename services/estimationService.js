const sequelize = require("../config/db");
const { Estimation } = require("../models/estimationModel");
const { EstimationType } = require("../models/estimationTypeModel");
const { Inverter } = require("../models/inverterModel");

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
    console.log("this is the gst   ", gst);
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

    if (!inverter_wattage || inverter_wattage <= 0) {
      throw new Error("Inverter wattage is required");
    }

    // --------------------------------
    // Calculate total system capacity
    // --------------------------------
    const total_kw = (panel_qty * panel_wattage) / 1000;

    // --------------------------------
    // Convert inverter wattage to KW
    // --------------------------------
    const inverter_kw = Number(inverter_wattage);

    // --------------------------------
    // Find nearest inverter
    // --------------------------------
    const inverters = await Inverter.findAll({
      attributes: ["id", "kw", "price"],
      order: [["kw", "ASC"]],
    });

    if (!inverters.length) {
      throw new Error("No inverter found");
    }

    // Find exact inverter first
    let selectedInverter = inverters.find(
      (inverter) => Number(inverter.kw) === inverter_kw,
    );

    // If exact inverter doesn't exist,
    // find the nearest inverter
    if (!selectedInverter) {
      selectedInverter = inverters.reduce((nearest, current) => {
        const currentDifference = Math.abs(Number(current.kw) - inverter_kw);

        const nearestDifference = Math.abs(Number(nearest.kw) - inverter_kw);

        return currentDifference < nearestDifference ? current : nearest;
      });
    }

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
        qty = 1;
        price = Number(selectedInverter.price);

        const amount = qty * price;

        const gstAmount = (amount * Number(item.gst)) / 100;

        return {
          id: item.id,
          type_id: item.type_id,
          type: item.type?.name || null,
          name: item.name,
          qty,
          inverter_kw: Number(selectedInverter.kw),
          inverter_id: selectedInverter.id,
          price,
          gst: Number(item.gst),
          amount,
          gst_amount: gstAmount,
          total: amount + gstAmount,
        };
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
      else if (itemName === "LABOURE CHARGE" || itemName === "LABOUR CHARGE") {
        qty = total_kw;
      }

      // --------------------------------
      // Normal items
      // --------------------------------
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

      inverter: {
        requested_wattage: Number(inverter_wattage),
        requested_kw: inverter_kw,
        selected_id: selectedInverter.id,
        selected_kw: Number(selectedInverter.kw),
        selected_price: Number(selectedInverter.price),
        exact_match: Number(selectedInverter.kw) === inverter_kw,
      },

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

module.exports = {
  getEstimations,
  getEstimationTypes,
  addEstimation,
  updateEstimation,
  generateEstimation,
  getInverters,
  addInverter,
  updateInverter,
};
