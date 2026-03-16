const docCollectService = require("../services/docCollectService");

async function getLeadDetailFromCustomerId(req, res) {
  const { customer_id } = req.params; // or req.query if you pass it as query
  if (!customer_id) {
    return res
      .status(400)
      .json({ success: false, message: "customer_id is required" });
  }

  try {
    const lead =
      await docCollectService.getLeadDetailFromCustomerId(customer_id);

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found for this customer" });
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
async function getCustomerDocumentByCustomerId(req, res) {
  const { customer_id } = req.params;
  if (!customer_id) {
    return res
      .status(400)
      .json({ success: false, message: "customer_id is required" });
  }

  try {
    const document =
      await docCollectService.getCustomerDocumentByCustomerId(customer_id);

    return res.status(200).json({ success: true, data: document || null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function upsertCustomerDocument(req, res) {
  const { customer_id } = req.body;
  console.log(customer_id);
  if (!customer_id) {
    return res
      .status(400)
      .json({ success: false, message: "customer_id is required" });
  }

  try {
    const document = await docCollectService.upsertCustomerDocument(
      customer_id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Customer document saved successfully",
      data: document,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function uploadDocsToDrive(req, res) {
  try {
    const { customerId,customerName,contactNumber } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploaded = await docCollectService.uploadBulkFiles(files,customerName,contactNumber);
    // const uploaded = await docCollectService.checkUserExists("harsh877698@outlook.com");

    return res.status(200).json({
      success: true,
      files: uploaded,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
}

module.exports = {
  getLeadDetailFromCustomerId,
  getCustomerDocumentByCustomerId,
  upsertCustomerDocument,
  uploadDocsToDrive,
};
