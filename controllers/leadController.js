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
      inverter_kw,
      number_of_inverters,
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
      inverter_kw,
      number_of_inverters,
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

async function addLeadBySource(req, res) {
  try {
    const {
      customer_name,
      contact_number,
      site_visit_date,
      address,
      notes,
      panel_wattage,
      number_of_panels,
      status,
      installation_type,
      inverter_kw,
      number_of_inverters,
    } = req.body;

    const source_id = req.user.role_id;

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
      inverter_kw,
      number_of_inverters,
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

async function fetchPendingLeadsCount(req, res) {
  try {
    const count = await leadService.getPendingLeadsCount();

    return res.status(200).json({
      success: true,
      count: count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function delayLead(req, res) {
  try {
    const { lead_id, next_visit_date, note } = req.body;

    if (!lead_id || !next_visit_date) {
      return res.status(400).json({
        success: false,
        message: "Lead ID and next follow-up date are required",
      });
    }

    const delay = await leadService.delayLeadTransaction({
      lead_id,
      next_visit_date,
      note,
    });

    return res.status(201).json({
      success: true,
      message: "Lead delayed successfully",
      data: delay,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function delayToPending(req, res) {
  try {
    const { lead_id } = req.body;
    if (!lead_id) {
      return res
        .status(400)
        .json({ success: false, message: "Lead ID is required" });
    }

    const result = await leadService.delayToPending(lead_id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function convertToCustomer(req, res) {
  try {
    const { lead_id } = req.body;

    if (!lead_id) {
      return res.status(400).json({
        success: false,
        message: "lead_id is required",
      });
    }

    const customer = await leadService.convertToCustomer(lead_id);

    return res.status(200).json({
      success: true,
      message: "Lead converted to customer successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error converting lead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function cancelLead(req, res) {
  try {
    const { lead_id, reason } = req.body;

    if (!lead_id) {
      return res.status(400).json({
        success: false,
        message: "lead_id is required",
      });
    }

    const result = await leadService.cancelLead({ lead_id, reason });

    return res.status(200).json({
      success: true,
      message: "Lead cancelled successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function updateLead(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const lead = await leadService.updateLead(req.body);

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// controllers/leadController.js

async function fetchLeadById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead id is required",
      });
    }

    const result = await leadService.getLeadById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching lead by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch lead",
    });
  }
}

async function fetchLeadsBySource(req, res) {
  try {
    const source_id = req.user.role_id; // 👈 same pattern

    if (!source_id) {
      return res.status(400).json({
        message: "fabricator_id is required",
      });
    }

    const leads = await leadService.getLeadsBySource(source_id);

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

async function updateLeadVisitDate(req, res) {
  try {
    const { id, date } = req.body;

    if (!id || !date) {
      return res.status(400).json({
        success: false,
        message: "id and date are required",
      });
    }

    const result = await leadService.updateLeadVisitDate(id, date);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      message: "Lead visit date updated successfully",
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function pendingCounts(req, res) {
  try {
    const counts = await leadService.getPendingCounts();
    res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending counts",
      error: error.message,
    });
  }
}

async function deleteLeadById(req, res) {
  try {
    const { id } = req.params;

    const deletedCount = await leadService.deleteLeadById(id);

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error.message,
    });
  }
}

module.exports = {
  addLead,
  fetchPendingLeads,
  fetchLeadsByStatus,
  fetchPendingLeadsCount,
  delayLead,
  delayToPending,
  convertToCustomer,
  cancelLead,
  updateLead,
  fetchLeadById,
  fetchLeadsBySource,
  addLeadBySource,
  updateLeadVisitDate,
  pendingCounts,
  deleteLeadById,
};
