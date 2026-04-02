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
    const { brand_name, wire_type, color, gauge, stock, price, tax } = req.body;

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
      price,
      tax,
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
    const { brand_name, wire_type, color, gauge, stock, price, tax } = req.body;

    // Call the service to update
    const result = await wiringService.updateWireInventoryById(id, {
      brand_name,
      wire_type,
      color,
      gauge,
      stock,
      price,
      tax,
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

// controllers/wiringController.js

async function getAvailableWireInventory(req, res) {
  try {
    const { id } = req.params;
    console.log(id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "wiring_id is required",
      });
    }

    const result = await wiringService.getAvailableWireInventoryForWiring(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching available wire inventory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function createWiringItem(req, res) {
  try {
    const { wiring_id, wire_inventory_id, qty } = req.body;

    // Validate request
    if (!wiring_id || !wire_inventory_id || !qty) {
      return res.status(400).json({
        success: false,
        message: "wiring_id, wire_inventory_id and qty are required",
      });
    }

    // Call service
    const result = await wiringService.addWiringItem({
      wiring_id,
      wire_inventory_id,
      qty,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating wiring item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add wiring item",
    });
  }
}

async function fetchIssuedWires(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }
    const result = await wiringService.getIssuedWiresByWiringId(id);
    if (!result.success) return res.status(400).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 🔹 UPDATE TECHNICIAN
async function updateTechni(req, res) {
  try {
    const { wiringId } = req.params;
    const { technician_id } = req.body;

    if (!wiringId) {
      return res.status(400).json({
        success: false,
        message: "Wiring ID is required",
      });
    }

    if (!technician_id) {
      return res.status(400).json({
        success: false,
        message: "Technician ID is required",
      });
    }

    const result = await wiringService.updateWiringTechnician(
      wiringId,
      technician_id,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating technician:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update technician",
    });
  }
}

async function updateInventoryStatus(req, res) {
  try {
    const { wiringId } = req.params;

    if (!wiringId) {
      return res.status(400).json({
        success: false,
        message: "wiringId is required in params",
      });
    }

    const result = await wiringService.updateWiringInventoryStatus(
      wiringId,
      "done",
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating inventory status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update inventory status",
    });
  }
}

async function uploadWiringDocs(req, res) {
  try {
    const { wiringId, customerId } = req.body;
    const files = req.files;

    if (!wiringId || !customerId) {
      return res.status(400).json({
        success: false,
        message: "wiringId and customerId are required",
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const result = await wiringService.uploadWiringDocsWithCS(
      files,
      wiringId,
      customerId,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Files uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Error uploading wiring docs:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload wiring documents",
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
  updateWireInventory,
  getAvailableWireInventory,
  createWiringItem,
  fetchIssuedWires,
  updateTechni,
  updateInventoryStatus,
  uploadWiringDocs,
};
