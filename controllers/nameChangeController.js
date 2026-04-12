const { file } = require("googleapis/build/src/apis/file");
const nameChangeService = require("../services/nameChangeService");

async function uploadNameChangeFiles(req, res) {
  try {
    const { customerId, customerName, contactNumber } = req.body;
    const files = req.files;

    if (!customerId || !customerName || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "customerId, customerName, and contactNumber are required",
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploadedFiles = await nameChangeService.uploadNameChangeFiles(
      files,
      customerId,
      customerName,
      contactNumber,
    );

    const isReady = await nameChangeService.checkCustomerReady(customerId);

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
      nameChangeStatus: isReady,
    });
  } catch (error) {
    console.error("❌ NameChange Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading files",
      error: error.message,
    });
  }
}

async function checkReady(req, res) {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId, customerName, and contactNumber are required",
      });
    }

    const checkStatus = await nameChangeService.checkCustomerReady(customerId);
    return res.status(200).json({
      success: true,
      isReady: checkStatus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading files",
      error: error.message,
    });
  }
}

async function goToStageThree(req, res) {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const checkStatus = await nameChangeService.checkCustomerReady(customerId);

    if (!checkStatus.status) {
      return res.status(400).json({
        success: false,
        message: checkStatus.message || "You are not qualified for next stage",
      });
    }

    const result = await nameChangeService.goToStageThree(customerId);

    return res.status(200).json({
      success: true,
      message: result.message || "Moved to stage 3 successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ goToStageThree error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while moving to stage 3",
      error: error.message,
    });
  }
}

async function getNameChangeDocs(req, res) {
  try {
    const { customerId } = req.params;

    const docs =
      await nameChangeService.getNameChangeDocsByCustomerId(customerId);

    return res.status(200).json({
      success: true,
      message: "Name change documents fetched successfully",
      data: docs,
    });
  } catch (error) {
    console.error("Error fetching name change docs:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

module.exports = {
  uploadNameChangeFiles,
  checkReady,
  goToStageThree,
  getNameChangeDocs,
};
