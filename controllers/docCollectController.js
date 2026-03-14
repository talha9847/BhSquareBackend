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

module.exports = { getLeadDetailFromCustomerId };
