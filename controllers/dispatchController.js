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
    const { customer_id, driver_id, car_id, status } = req.body;

    // Validation
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "dispatch_id is required",
      });
    }

    const result = await dispatchService.updateDispatchByCustomerId({
      customer_id,
      driver_id,
      car_id,
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

async function createCar(req, res) {
  try {
    const { name, number } = req.body;

    if (!name || !number) {
      return res.status(400).json({
        success: false,
        message: "Name and number are required",
      });
    }

    let newName = name.toUpperCase();
    let newNumber = number.toUpperCase();

    const result = await dispatchService.addCar({
      name: newName,
      number: newNumber,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating car:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create car",
    });
  }
}

// 🔹 FETCH ALL CARS
async function fetchCars(req, res) {
  try {
    const result = await dispatchService.getAllCars();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching cars:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

// 🔹 UPDATE CAR
async function updateCar(req, res) {
  try {
    const { id } = req.params;
    const { name, number } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Car id is required",
      });
    }

    const result = await dispatchService.updateCar(id, {
      name,
      number,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating car:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update car",
    });
  }
}

async function fetchDispatchesByStatus(req, res) {
  try {
    const { status } = req.query;

    const data = await dispatchService.getAllDispatchesByStatus(status);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteKitItem(req, res) {
  try {
    const { kitItemId } = req.params;

    // 🔴 Validation
    if (!kitItemId) {
      return res.status(400).json({
        message: "kitItemId is required",
      });
    }

    // 🔹 Call service
    const result = await dispatchService.deleteKitItem(kitItemId);

    return res.status(200).json({
      message: result.message || "Kit item deleted successfully",
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);

    // 🔴 Known business errors
    if (
      error.message.includes("not found") ||
      error.message.includes("Failed to restore")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    // 🔴 Fallback server error
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function updateKitItemQty(req, res) {
  try {
    const { kitItemId, qty } = req.body;

    // 🔴 Validation
    if (!kitItemId || qty == null) {
      return res.status(400).json({
        message: "kitItemId and changeQty are required",
      });
    }

    if (typeof qty !== "number" || qty === 0) {
      return res.status(400).json({
        message: "changeQty must be a non-zero number",
      });
    }

    // 🔹 Call service
    const result = await dispatchService.updateKitItemQty(kitItemId, qty);

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);

    // 🔴 Business errors
    if (
      error.message.includes("not found") ||
      error.message.includes("Not enough stock") ||
      error.message.includes("deallocate")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    // 🔴 Server error
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
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
  createCar,
  fetchCars,
  updateCar,
  fetchDispatchesByStatus,
  deleteKitItem,
  updateKitItemQty,
};
