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

async function createFabricator(req, res) {
  try {
    const { name } = req.body;
    const fabricator = await dispatchService.addFabricator({ name });
    return res.status(201).json({
      success: true,
      data: fabricator,
    });
  } catch (error) {
    console.error("Error creating fabricator:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create fabricator",
    });
  }
}

async function fetchFabricators(req, res) {
  try {
    const fabricators = await dispatchService.getAllFabricators();
    return res.status(200).json({
      success: true,
      data: fabricators,
    });
  } catch (error) {
    console.error("Error fetching fabricators:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateFabricator(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const fabricator = await dispatchService.updateFabricator(id, { name });
    return res.status(200).json({
      success: true,
      data: fabricator,
    });
  } catch (error) {
    console.error("Error updating fabricator:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update fabricator",
    });
  }
}

async function fetchFabrications(req, res) {
  try {
    const fabrications = await dispatchService.getAllFabrications();

    return res.status(200).json({
      success: true,
      data: fabrications,
    });
  } catch (error) {
    console.error("Error fetching fabrications:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateFabrication(req, res) {
  try {
    console.log(req.body);
    const { customer_id, unused_pipes } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id or fabricator_id is required",
      });
    }

    const result = await dispatchService.updateFabricationByCustomerId({
      customer_id,
      unused_pipes,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in updateFabrication controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateFabricatorViaId(req, res) {
  try {
    const { customer_id, fabricator_id } = req.body;

    if (!customer_id || !fabricator_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id and fabricator_id are required",
      });
    }

    const result = await dispatchService.assignFabricatorByCustomerId({
      customer_id,
      fabricator_id,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateFabricator controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign fabricator",
    });
  }
}

// controllers/driverController.js

// 🔹 CREATE DRIVER
async function createDriver(req, res) {
  try {
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name and mobile are required",
      });
    }
    let newName = name.toUpperCase();

    const result = await dispatchService.addDriver({ name: newName, mobile });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating driver:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create driver",
    });
  }
}

// 🔹 FETCH ALL DRIVERS
async function fetchDrivers(req, res) {
  try {
    const result = await dispatchService.getAllDrivers();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

// 🔹 UPDATE DRIVER
async function updateDriver(req, res) {
  try {
    const { id } = req.params;
    const { name, mobile } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Driver id is required",
      });
    }

    const result = await dispatchService.updateDriver(id, {
      name,
      mobile,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating driver:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update driver",
    });
  }
}

module.exports = {
  fetchDispatches,
  updateDispatch,
  createFabricator,
  fetchFabricators,
  updateFabricator,
  fetchFabrications,
  updateFabrication,
  updateFabricatorViaId,
  createDriver,
  fetchDrivers,
  updateDriver,
};
