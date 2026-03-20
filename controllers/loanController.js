const loanService = require("../services/loanService");

// Controller to handle loan document upload
async function uploadLoanDocuments(req, res) {
  try {
    const { customerId, leadId } = req.body;
    const files = req.files; // assuming multer middleware

    if (!customerId || !leadId || !files || !files.length) {
      return res.status(400).json({
        success: false,
        message: "customerId, leadId and files are required",
      });
    }

    console.log(leadId, customerId);
    console.log(files);

    const customerInfo = await loanService.findCustomerName(leadId, customerId);

    if (!customerInfo.loan_id) {
      return res.status(404).json({
        success: false,
        message: "Loan not found for this customer",
      });
    }

    const { customer_name, cs_no, loan_id } = customerInfo;
    console.log(customerInfo);
    const uploadedFiles = await loanService.uploadLoanDocs(
      files,
      customer_name,
      cs_no, // you can also use contact number if needed
      loan_id,
    );

    return res.status(200).json({
      success: true,
      message: "Loan documents uploaded successfully",
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading loan documents:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getLoanByCustomerId(req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const loan = await loanService.byCustomerId(customerId);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found for this customer",
      });
    }

    return res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    console.error("Error in getLoanByCustomerId:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function updateLoan(req, res) {
  try {
    const { customerId } = req.params;
    const updateData = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const updatedLoan = await loanService.updateLoanByCustomerId(
      customerId,
      updateData,
    );

    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found for this customer",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: updatedLoan,
    });
  } catch (error) {
    console.error("Error in updateLoan controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function approveLoan(req, res) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const updatedLoan = await loanService.approveLoanByCustomerId(customerId);

    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found for this customer",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan approved successfully",
      data: updatedLoan,
    });
  } catch (error) {
    console.error("Error in approveLoan controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function completeLoanAndMoveToKitReady(req, res) {
  try {
    const { customerId } = req.params;

    // 🔹 Validate customerId
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customerId",
      });
    }

    // 🔹 Call service
    const result = await loanService.completeLoanAndMoveToKitReady(customerId);

    // 🔹 If something failed logically
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Operation failed or customer not found",
      });
    }

    // 🔹 Success response
    return res.status(200).json({
      success: true,
      message: "Loan completed and moved to Kit Ready stage successfully",
    });
  } catch (error) {
    console.error("Error in completeLoanAndMoveToKitReady controller:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  uploadLoanDocuments,
  getLoanByCustomerId,
  updateLoan,
  approveLoan,
  completeLoanAndMoveToKitReady,
};
