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
module.exports = {
  getEstimations,
  getEstimationTypes,
  addEstimation,
  updateEstimation,
};
