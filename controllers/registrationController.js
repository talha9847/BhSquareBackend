const registrationService = require("../services/registrationService");

async function getCustomersWithSummary(req, res) {
  try {
    const customers = await registrationService.getCustomersWithSummary();

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("❌ Error fetching customers summary:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}

module.exports = {
  getCustomersWithSummary,
};
