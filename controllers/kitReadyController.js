const { InverterSerial } = require("../models/inverterSerialModel");
const { PanelSerial } = require("../models/panelSerialModel");
const kitReadyService = require("../services/kitReadyService");

async function fetchKitReadyCustomers(req, res) {
  try {
    // ✅ get status from query, default = pending
    const { status = "pending" } = req.query;

    const customers = await kitReadyService.getKitReadyCustomers(status);

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function deleteCustomerData(req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await kitReadyService.deleteCustomerFullData(customerId);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function updateKitReadyStatusDelay(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ✅ basic validation
    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "id and status are required",
      });
    }

    const updated = await kitReadyService.updateKitReadyStatusDelay(id, status);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function updateLoan(req, res) {
  try {
    const { customerId, loanRequired } = req.body;

    if (!customerId || typeof loanRequired !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "customerId and loanRequired (boolean) are required",
      });
    }

    await kitReadyService.updateLoanStatus(loanRequired, customerId);

    return res.status(200).json({
      success: true,
      message: `Loan status updated successfully for customer ${customerId}`,
    });
  } catch (error) {
    console.error("Error updating loan status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
async function updateLoanFromRegistration(req, res) {
  try {
    const { customerId, loanRequired } = req.body;

    if (!customerId || typeof loanRequired !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "customerId and loanRequired (boolean) are required",
      });
    }

    await kitReadyService.updateLoanStatusFromRegisration(true, customerId);

    return res.status(200).json({
      success: true,
      message: `Loan status updated successfully for customer ${customerId}`,
    });
  } catch (error) {
    console.error("Error updating loan status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getAllBrands(req, res) {
  try {
    const brands = await kitReadyService.getAllBrands();

    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createInventory(req, res) {
  try {
    console.log(req.body);
    const inventory = await kitReadyService.addInventory(req.body);

    return res.status(201).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllInventory(req, res) {
  try {
    const data = await kitReadyService.getAllInventory();

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error("❌ Error in getAllInventory controller:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function createBrand(req, res) {
  try {
    const brand = await kitReadyService.addBrand(req.body);

    return res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateBrand(req, res) {
  try {
    const { id } = req.params;

    const updated = await kitReadyService.updateBrand(id, req.body);

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
async function deleteBrand(req, res) {
  try {
    const { id } = req.params;

    await kitReadyService.deleteBrand(id);

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateInventory(req, res) {
  try {
    const { id } = req.params;

    const updatedInventory = await kitReadyService.updateInventory(
      id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: updatedInventory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function addKitItems(req, res) {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const result = await kitReadyService.addKitItemsByCustomer(customerId);

    // If items already exist
    if (result.message.includes("already")) {
      return res.status(210).json({
        success: true,
        data: result,
      });
    }

    // If items created successfully
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function fetchKitItems(req, res) {
  try {
    const { customerId } = req.params;

    const items = await kitReadyService.getKitItemsByCustomer(customerId);

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function fetchAvailableProducts(req, res) {
  try {
    const { customerId } = req.params;

    const products =
      await kitReadyService.getAvailableProductsForKit(customerId);

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function addItem(req, res) {
  try {
    const { kit_id, inventory_id } = req.body;

    const item = await kitReadyService.addItemToKit({
      kit_id,
      inventory_id,
    });

    return res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function allocateItem(req, res) {
  try {
    const { kit_item_id, qty } = req.body;

    const result = await kitReadyService.allocateKitItem({
      kit_item_id,
      qty,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getPanelAndInventer(req, res) {
  try {
    const { customerId } = req.params;

    const result =
      await kitReadyService.getPanelAndInverterByCustomerId(customerId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function addCustomerSerials(req, res) {
  try {
    const { customerId, inverterId, panelId } = req.body;
    console.log(panelId, inverterId, "    panel and inveter");
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    // ✅ Check if customer already has any panel or inverter serials
    // const existingPanels = await PanelSerial.count({
    //   where: { customer_id: customerId },
    // });
    // const existingInverters = await InverterSerial.count({
    //   where: { customer_id: customerId },
    // });

    // if (existingPanels > 0 || existingInverters > 0) {
    //   return res.status(201).json({
    //     success: true,
    //     message: "Serials already exist for this customer",
    //     data: {
    //       panel_count: existingPanels,
    //       inverter_count: existingInverters,
    //     },
    //   });
    // }

    // Call service to insert serials and create dispatch
    const result = await kitReadyService.addSerialsAndDispatch(
      customerId,
      panelId,
      inverterId,
    );

    return res.status(201).json({
      success: true,
      message: "Serials added and dispatch created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in addCustomerSerials controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

// controllers/kitController.js

async function fetchKitItemsbyCustomer(req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await kitReadyService.getKitItemsByCustomerId(customerId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching kit items:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch kit items",
    });
  }
}

async function fetchKitReadyCustomersByStatus(req, res) {
  try {
    const { status } = req.query;

    const result = await kitReadyService.getKitReadyCustomersByStatus(status);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createCategory(req, res) {
  try {
    const category = await kitReadyService.addCategory(req.body);

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid id is required",
      });
    }

    const updated = await kitReadyService.updateCategory(id, req.body);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const status = error.message === "Category not found" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await kitReadyService.getCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// controllers/serialController.js

async function fetchCustomerSerials(req, res) {
  try {
    const { customerId } = req.params;

    const result = await kitReadyService.getCustomerSerials(customerId);

    return res.status(200).json({
      success: true,
      message: "Customer serials fetched successfully",
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
async function updateSingleSerial(req, res) {
  try {
    const { id, type, serial_number } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Serial ID is required",
      });
    }

    if (!serial_number) {
      return res.status(400).json({
        success: false,
        message: "New serial number is required",
      });
    }

    let updatedSerial;

    if (type === "panel") {
      updatedSerial = await kitReadyService.updatePanelSerialById(
        id,
        serial_number,
      );
    } else if (type === "inverter") {
      updatedSerial = await kitReadyService.updateInverterSerialById(
        id,
        serial_number,
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Type must be 'panel' or 'inverter'",
      });
    }

    return res.status(200).json({
      success: true,
      message: `${type} serial updated successfully`,
      data: updatedSerial,
    });
  } catch (error) {
    console.error("Error updating serial:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Update failed",
    });
  }
}

async function getKitByCustomerId(req, res) {
  try {
    const { customerId } = req.params;

    const result = await kitReadyService.getKitByCustomerId(customerId);

    return res.status(200).json({
      success: true,
      message: "Kit items fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function createUnusedInventory(req, res) {
  try {
    const result = await kitReadyService.createUnusedInventory(req.body);

    return res.status(200).json({
      success: true,
      message: "Unused inventory created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function getUnusedInventoryByCustomerId(req, res) {
  try {
    const { customerId } = req.params;

    const result =
      await kitReadyService.getUnusedInventoryByCustomerId(customerId);

    return res.status(200).json({
      success: true,
      message: "Unused inventory fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function deleteUnusedInventory(req, res) {
  try {
    const { unusedId, customer_id, inventory_id } = req.body;

    const result = await kitReadyService.deleteUnusedInventory({
      unusedId,
      customer_id,
      inventory_id,
    });

    return res.status(200).json({
      success: true,
      message: "Unused inventory deleted successfully",
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
  fetchKitReadyCustomers,
  updateLoan,
  getAllBrands,
  createInventory,
  getAllInventory,
  createBrand,
  updateBrand,
  deleteBrand,
  updateInventory,
  addKitItems,
  fetchKitItems,
  fetchAvailableProducts,
  addItem,
  allocateItem,
  getPanelAndInventer,
  addCustomerSerials,
  fetchKitItemsbyCustomer,
  fetchKitReadyCustomersByStatus,
  createCategory,
  updateCategory,
  getCategories,
  fetchCustomerSerials,
  updateSingleSerial,
  getKitByCustomerId,
  createUnusedInventory,
  getUnusedInventoryByCustomerId,
  deleteUnusedInventory,
  updateLoanFromRegistration,
  updateKitReadyStatusDelay,
  deleteCustomerData,
};
