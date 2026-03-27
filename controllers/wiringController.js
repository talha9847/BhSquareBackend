const { FLOAT } = require("sequelize");
const wiringService = require("../services/wiringService");

async function createTechnician(req, res) {
  try {
    const { name } = req.body;
    const technician = await wiringService.addTechnician({ name });

    return res.status(201).json({
      success: true,
      data: technician,
    });
  } catch (error) {
    console.error("Error creating technician:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create technician",
    });
  }
}

async function fetchTechnicians(req, res) {
  try {
    const technicians = await wiringService.getAllTechnicians();

    return res.status(200).json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateTechnician(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const technician = await wiringService.updateTechnician(id, { name });

    return res.status(200).json({
      success: true,
      data: technician,
    });
  } catch (error) {
    console.error("Error updating technician:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update technician",
    });
  }
}

async function fetchWiringCustomerDetails(req, res) {
  try {
    const data = await wiringService.getWiringCustomerDetails();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching wiring customer details:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch wiring customer details",
    });
  }
}

async function createWireInventory(req, res) {
  try {
    const { brand_name, wire_type, color, gauge, stock } = req.body;

    if (!brand_name || !wire_type || !color || !gauge || !stock) {
      return res.status(400).json({
        success: false,
        message: "All fields (brand, type, color, gauge, qty) are required",
      });
    }
    if (isNaN(gauge) || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: "Gauge and qty must be numbers",
      });
    }

    const result = await wiringService.addWireInventory({
      brand_name,
      wire_type,
      color,
      gauge: Number(gauge),
      stock: Number(stock),
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("Error creating wire inventory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create wire inventory",
    });
  }
}

async function fetchAllWireInventory(req, res) {
  try {
    const result = await wiringService.getAllWireInventory();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching wire inventory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch wire inventory",
    });
  }
}

async function updateWireInventory(req, res) {
  try {
    const { id } = req.params;
    const { brand_name, wire_type, color, gauge, stock } = req.body;

    // Call the service to update
    const result = await wireInventoryService.updateWireInventoryById(id, {
      brand_name,
      wire_type,
      color,
      gauge,
      stock,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("Error updating wire inventory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update wire inventory",
    });
  }
}

module.exports = {
  updateTechnician,
  fetchTechnicians,
  createTechnician,
  fetchWiringCustomerDetails,
  createWireInventory,
  fetchAllWireInventory,
};
