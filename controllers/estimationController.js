const estimationService = require("../services/estimationService");

async function getEstimations(req, res) {
  try {
    const result = await estimationService.getEstimations();

    return res.status(200).json({
      success: true,
      message: "Estimations fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function getEstimationTypes(req, res) {
  try {
    const result = await estimationService.getEstimationTypes();

    return res.status(200).json({
      success: true,
      message: "Estimation types fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function addEstimation(req, res) {
  try {
    const { type_id, name, qty, price, gst } = req.body;

    const result = await estimationService.addEstimation({
      type_id,
      name,
      qty,
      price,
      gst,
    });

    return res.status(201).json({
      success: true,
      message: "Estimation added successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
async function updateEstimation(req, res) {
  try {
    const { id } = req.params;
    const { type_id, name, qty, price, gst } = req.body;
    console.log("in contorller i am the gst  ", gst);
    const result = await estimationService.updateEstimation(id, {
      type_id,
      name,
      qty,
      price,
      gst,
    });

    return res.status(200).json({
      success: true,
      message: "Estimation updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function generateEstimation(req, res) {
  try {
    const { panel_qty, panel_wattage, panel_rate_per_watt, inverter_wattage } =
      req.body;

    const result = await estimationService.generateEstimation({
      panel_qty,
      panel_wattage,
      panel_rate_per_watt,
      inverter_wattage,
    });

    return res.status(200).json({
      success: true,
      message: "Estimation generated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function getInverters(req, res) {
  try {
    const result = await estimationService.getInverters();

    return res.status(200).json({
      success: true,
      message: "Inverters fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function addInverter(req, res) {
  try {
    const { kw, price } = req.body;

    const result = await estimationService.addInverter({
      kw,
      price,
    });

    return res.status(201).json({
      success: true,
      message: "Inverter added successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateInverter(req, res) {
  try {
    const { id } = req.params;
    const { kw, price } = req.body;

    const result = await estimationService.updateInverter(id, {
      kw,
      price,
    });

    return res.status(200).json({
      success: true,
      message: "Inverter updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

const deleteEstimation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await estimationService.deleteEstimation(id);

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Delete estimation error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Failed to delete estimation",
    });
  }
};

async function createAgency(req, res) {
  try {
    const agency = await estimationService.addAgency(req.body);

    return res.status(201).json({
      success: true,
      data: agency,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateAgency(req, res) {
  try {
    const { id } = req.params;

    const updated = await estimationService.updateAgency(id, req.body);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteAgency(req, res) {
  try {
    const { id } = req.params;

    await estimationService.deleteAgency(id);

    return res.status(200).json({
      success: true,
      message: "Agency deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllAgencies(req, res) {
  try {
    const agencies = await estimationService.getAllAgencies();

    return res.status(200).json({
      success: true,
      data: agencies,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function createAgencyInventory(req, res) {
  try {
    const agencyInventory = await estimationService.createAgencyInventory(
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Inventory sent to agency successfully",
      data: agencyInventory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

const getAllAgencyInventory = async (req, res) => {
  try {
    const data = await estimationService.getAllAgencyInventory();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get All Agency Inventory Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get agency inventory",
      error: error.message,
    });
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
  createAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies,
  createAgencyInventory,
  getAllAgencyInventory,
};
