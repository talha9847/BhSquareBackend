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
  
    if (panel.number_of_inverters !== data.inverter_qty) {
      return res.status(400).json({
        success: false,
        message: `Inverter quantity mismatch. Lead has ${panel.number_of_inverters}, but you sent ${data.inverter_qty}.`,
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

    // 🔴 Basic validation
    if (!registrationId || !customerId || !leadId) {
      return res.status(400).json({
        message: "registrationId, customerId, and leadId are required",
      });
    }

    if (!data) {
      return res.status(400).json({
        message: "data object is required",
      });
    }

    const { panel_id, panel_qty, inverter_id, inverter_qty, cs_no } = data;

    // 🔴 Validate required fields inside data
    if (!panel_id || !panel_qty || !inverter_id || !inverter_qty || !cs_no) {
      return res.status(400).json({
        message:
          "panel_id, panel_qty, inverter_id, inverter_qty, and cs_no are required",
      });
    }

    // 🔹 Call service
    const result = await registrationService.markRegistrationAsDone(
      registrationId,
      customerId,
      leadId,
      data,
    );

    // 🔴 Business failure (from service)
    if (!result.success) {
      return res.status(400).json({
        message: result.message || "Cannot update status",
      });
    }

    // ✅ Success response
    return res.status(200).json({
      message: `Registration status updated to '${result.new_status}'`,
      registration_id: result.registration_id,
    });
  } catch (error) {
    console.error("❌ Error marking registration as done:", error);

    // 🔴 Handle known business errors
    if (
      error.message.includes("stock") ||
      error.message.includes("exceeds") ||
      error.message.includes("not found")
    ) {
      return res.status(400).json({ message: error.message });
    }

    // 🔴 Fallback server error
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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
      PANEL_BRAND: d.panelBrand?.name || "",
      INVERTER_BRAND: d.inverterBrand?.name || "",
      PANEL_CAPACITY:
        d.panel_capacity != null ? Math.floor(d.panel_capacity).toString() : "",
      PANEL_QUANTITY: d.panel_quantity != null ? String(d.panel_quantity) : "",
      SYSTEM_CAPACITY:
        d.system_capacity != null ? (d.system_capacity / 1000).toFixed(2) : "",
      INVERTER_CAPACITY:
        d.inverter_capacity != null
          ? Number(d.inverter_capacity).toFixed(2)
          : "",

      TOTAL_CAPACITY:
        d.inverter_quantity != null && d.inverter_capacity != null
          ? (d.inverter_quantity * Number(d.inverter_capacity)).toFixed(2)
          : "",

      INVERTER_QUANTITY: d.inverter_quantity ?? "",
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

async function fetchCustomersByStatus(req, res) {
  try {
    const { status } = req.query;

    const customers = await registrationService.getCustomersByStatus(status);

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getInventoryByCategory(req, res) {
  try {
    const data = await registrationService.getInventoryByCategory(1);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
async function getInventoryByCategoryThree(req, res) {
  try {
    const data = await registrationService.getInventoryByCategory(3);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getCustomersWithSummary,
  registration,
  markRegistrationAsDone,
  getFileGeneration,
  fetchCustomersByStatus,
  getInventoryByCategory,
  getInventoryByCategoryThree,
};
