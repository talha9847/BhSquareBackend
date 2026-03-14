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

module.exports = { getCustomers };
