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

    const status = await docCollectService.checkCustomerReady(customer_id);

    return res
      .status(200)
      .json({ success: true, data: lead, readyForNextStage: status });
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
    const { customerId, docId, customerName, contactNumber } = req.body;
    console.log(docId);
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploaded = await docCollectService.uploadBulkFiles(
      files,
      customerName,
      contactNumber,
      docId,
    );

    const status = await docCollectService.checkCustomerReady(customerId);

    // const uploaded = await docCollectService.checkUserExists("harsh877698@outlook.com");

    return res.status(200).json({
      success: true,
      files: uploaded,
      readyForNextStage: status,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
}
async function completeStageAndPrepareNext(req, res) {
  try {
    const { customer_id } = req.body;
    if (!customer_id)
      return res
        .status(400)
        .json({ success: false, message: "customer_id required" });

    const result =
      await docCollectService.completeStageAndPrepareNext(customer_id);

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error completing stage:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function checkDocumentCollectionAccess(req, res) {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id is required",
      });
    }

    const customer =
      await docCollectService.checkDocumentCollectionAccess(customer_id);

    return res.status(200).json({
      success: true,
      message: "Access granted",
      data: customer,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getLeadDetailFromCustomerId,
  getCustomerDocumentByCustomerId,
  upsertCustomerDocument,
  uploadDocsToDrive,
  completeStageAndPrepareNext,
  checkDocumentCollectionAccess,
};
