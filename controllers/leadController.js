const leadService = require("../services/leadService");

async function addLead(req, res) {
  try {
    const {
      customer_name,
      contact_number,
      site_visit_date,
      source_id,
      address,
      notes,
      panel_wattage,
      number_of_panels,
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!contact_number) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    const lead = await leadService.addLead({
      customer_name,
      contact_number,
      site_visit_date,
      source_id,
      address,
      notes,
      panel_wattage,
      number_of_panels,
    });

    return res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function fetchPendingLeads(req, res) {
  try {
    const leads = await leadService.getPendingLeads();
    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { addLead, fetchPendingLeads };
