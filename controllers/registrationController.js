const registrationService = require("../services/registrationService");
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");
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
    const { registrationId, customerId, leadId, data } = req.body;

    console.log(data);


    const result = await registrationService.markRegistrationAsDone(
      registrationId,
      customerId,
      leadId,
      data,
    );

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

async function getFileGeneration(req, res) {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: "registrationId is required",
      });
    }

    const result =
      await registrationService.getFileGenerationData(registrationId);

    if (!result.success) {
      return res.status(404).json(result);
    }
    const d = result.data;

    // Load template from project root
    const templatePath = path.join(
      __dirname,
      "..",
      "solar_template_FINAL.docx",
    );
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" }, // ← single braces
    });

    doc.render({
      BENEFICIARY_NAME: d.beneficiary_name || "",
      BENEFICIARY_ADDRESS: d.beneficiary_address || "",
      CONSUMER_NUMBER: d.consumer_number || "",
      APPLICATION_NUMBER: d.application_number || "",
      AGREEMENT_DATE: d.agreement_date || "",
      REGISTRATION_DATE: d.registration_date || "",
      SUBDIVISION: d.subdivision || "",
      PANEL_BRAND: d.panel_brand || "",
      PANEL_CAPACITY: String(d.panel_capacity || ""),
      SYSTEM_CAPACITY: String(d.system_capacity || ""),
      INVERTER_BRAND: d.inverter_brand || "",
      INVERTER_CAPACITY: String(d.inverter_capacity || ""),
    });

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="agreement_${d.cs_no || registrationId}.docx"`,
    });
    res.status(200);
    return res.send(buffer);
  } catch (error) {
    console.error("❌ Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  getCustomersWithSummary,
  registration,
  markRegistrationAsDone,
  getFileGeneration,
};
