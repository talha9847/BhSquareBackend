const kitReadyService = require("../services/kitReadyService");

async function fetchKitReadyCustomers(req, res) {
  try {
    const customers = await kitReadyService.getKitReadyCustomers();

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
};
