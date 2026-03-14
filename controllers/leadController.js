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
      status,
      installation_type,
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!contact_number) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    if (!source_id) {
      return res.status(400).json({ message: "Source  is required" });
    }
    if (!address) {
      return res.status(400).json({ message: "Address  is required" });
    }

    const lead = await leadService.addLead({
      customer_name,
      contact_number,
      site_visit_date,
      source_id,
      address,
      notes,
      status,
      panel_wattage,
      number_of_panels,
      installation_type,
    });

    return res.status(201).json({
      success: true,
      data: lead,
    });
    // return res.status(201).json({
    //   success: true,
    //   message: "taht lkjdlkjc",
    // });
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

async function fetchLeadsByStatus(req, res) {
  try {
    const { status } = req.query;
    const allowedStatuses = ["pending", "converted", "delayed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const leads = await leadService.getLeadsByStatus(status);

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

module.exports = { addLead, fetchPendingLeads, fetchLeadsByStatus };
