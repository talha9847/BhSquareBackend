const customerService = require("../services/customerService");

async function getCustomers(req, res) {
  try {
    const customers = await customerService.getCustomersWithLeadData();

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

async function updateCustomerNameChange(req, res) {
  try {
    const { id, name_change } = req.body;
    if (!id || !name_change) {
      return res.status(400).json({
        success: false,
        message: "customerId and name_change are required",
      });
    }

    const updatedCustomer = await customerService.updateCustomerNameChange(
      id,
      name_change,
    );

    return res.status(200).json({
      success: true,
      data: updatedCustomer,
      message: "Customer name_change updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// controllers/customerStageController.js

async function fetchCustomerStages(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await customerService.getCustomerStages(id);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchCustomerStages:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getCustomers,
  updateCustomerNameChange,
  fetchCustomerStages,
};
