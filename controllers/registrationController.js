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

async function registration(req, res) {
  try {
    const { data, leadId, customerId } = req.body;

    const panel = await registrationService.getNumberOfPanelsByLeadId(leadId);
    if (!panel.success) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    if (panel.number_of_panels !== data.panel_qty) {
      return res.status(400).json({
        success: false,
        message: `Panel quantity mismatch. Lead has ${panel.number_of_panels}, but you sent ${data.panel_qty}.`,
      });
    }

    if (!customerId || !data) {
      return res.status(400).json({
        success: false,
        message: "customer_id and registrationData required",
      });
    }

    const result =
      await registrationService.createCustomerRegistrationWithPanels(
        customerId,
        data,
      );

    res
      .status(201)
      .json({ success: true, message: "Registration created", data: result });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function markRegistrationAsDone(req, res) {
  try {
    const { registrationId } = req.body;
    const result =
      await registrationService.markRegistrationAsDone(registrationId);

    if (!result.success) {
      return res
        .status(400)
        .json({ message: result.message || "Cannot update status" });
    }

    return res.status(200).json({
      message: `Registration status updated to '${result.new_status}'`,
      registration_id: result.registration_id,
    });
  } catch (error) {
    console.error("❌ Error marking registration as done:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

module.exports = {
  getCustomersWithSummary,
  registration,
  markRegistrationAsDone,
};
