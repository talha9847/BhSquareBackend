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

async function fetchCustomerStagesByLeadId(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await customerService.getCustomerStagesByLeadId(id);

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

async function fetchCustomersByStatus(req, res) {
  try {
    const { status } = req.query; // ?status=pending or ?status=done

    const result = await customerService.getCustomersByStatus(status);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteCustomerWithLead(req, res) {
  try {
    const { id } = req.params;

    await customerService.deleteCustomerWithLead(id);

    return res.status(200).json({
      success: true,
      message: "Customer and related data deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCustomerWithLead controller:", error);

    // 🔹 Handle specific errors
    if (error.message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Customer id is required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // 🔹 Generic error
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
}

module.exports = {
  getCustomers,
  updateCustomerNameChange,
  fetchCustomerStages,
  fetchCustomersByStatus,
  fetchCustomerStagesByLeadId,
  deleteCustomerWithLead,
};
