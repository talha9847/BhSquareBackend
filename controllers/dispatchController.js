const dispatchService = require("../services/dispatchService");

async function fetchDispatches(req, res) {
  try {
    const dispatchData = await dispatchService.getAllDispatches();

    return res.status(200).json({
      success: true,
      data: dispatchData,
    });
  } catch (error) {
    console.error("Error fetching dispatches:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateDispatch(req, res) {
  try {
    const { customer_id, driver_name, vehicle, status } = req.body;

    // Validation
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "dispatch_id is required",
      });
    }

    const result = await dispatchService.updateDispatchByCustomerId({
      customer_id,
      driver_name,
      vehicle,
      status,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating dispatch:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

module.exports = { fetchDispatches, updateDispatch };
