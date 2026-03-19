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

module.exports = {
  fetchKitReadyCustomers,
  updateLoan,
};
