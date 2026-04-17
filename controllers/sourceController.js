const sourceService = require("../services/sourceService");

async function fetchSources(req, res) {
  try {
    const sources = await sourceService.getSources();

    return res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
async function fetchSupervisor(req, res) {
  try {
    const sources = await sourceService.getSupervisor();

    return res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addSource(req, res) {
  try {
    const { name, residential_commission, commercial_commission } = req.body;

    if (!name || !residential_commission || !commercial_commission) {
      return res.status(400).json({
        success: false,
        message: "name, residential_commission,commercial_commission required",
      });
    }

    const source = await sourceService.addSource(
      name,
      residential_commission,
      commercial_commission,
    );

    return res.status(201).json({
      success: true,
      message: "Source added successfully",
      data: source,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function addSupervisor(req, res) {
  try {
    const { name, residential_commission, commercial_commission } = req.body;

    if (!name || !residential_commission || !commercial_commission) {
      return res.status(400).json({
        success: false,
        message: "name, residential_commission,commercial_commission required",
      });
    }

    const source = await sourceService.addSupervisor(
      name,
      residential_commission,
      commercial_commission,
    );

    return res.status(201).json({
      success: true,
      message: "Source added successfully",
      data: source,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function fetchAllSources(req, res) {
  try {
    const sources = await sourceService.getAllSources();
    return res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
async function fetchAllSupervisor(req, res) {
  try {
    const sources = await sourceService.getAllSupervisors();
    return res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function getFinalStageCustomers(req, res) {
  try {
    // 🔹 Call service
    const data = await sourceService.getFinalStageCustomers();

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "No final stage customers found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Final stage customers fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function getFinalStageCustomersByStatus(req, res) {
  try {
    const { status } = req.query; // 🔹 pending / done

    // 🔹 Call service
    const data = await sourceService.getFinalStageCustomersByStatus(status);

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "No final stage customers found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Final stage customers fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function updateSupervisorViaId(req, res) {
  try {
    const { customer_id, supervisor_id } = req.body;

    if (!customer_id || !supervisor_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id and fabricator_id are required",
      });
    }

    const result = await sourceService.assignSupervisorByCustomerId({
      customer_id,
      supervisor_id,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign supervisor",
    });
  }
}

async function updateStage10(req, res) {
  try {
    const { customerId, flag } = req.body;

    if (!customerId || typeof flag !== "boolean") {
      return res.status(400).json({
        message: "customerId and boolean flag are required",
      });
    }

    const result = await sourceService.updateStage10(customerId, flag);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error.message?.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

async function updateStage11(req, res) {
  try {
    const { customerId, flag } = req.body;

    if (!customerId || typeof flag !== "boolean") {
      return res.status(400).json({
        message: "customerId and boolean flag are required",
      });
    }

    const result = await sourceService.updateStage11(customerId, flag);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error.message?.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

async function updateStage12(req, res) {
  try {
    const { customerId, flag } = req.body;

    if (!customerId || typeof flag !== "boolean") {
      return res.status(400).json({
        message: "customerId and boolean flag are required",
      });
    }

    const result = await sourceService.updateStage12(customerId, flag);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error.message?.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

async function updateStage13(req, res) {
  try {
    const { customerId, flag } = req.body;

    if (!customerId || typeof flag !== "boolean") {
      return res.status(400).json({
        message: "customerId and boolean flag are required",
      });
    }

    const result = await sourceService.updateStage13(customerId, flag);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error.message?.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}
async function updateStage14(req, res) {
  try {
    const { customerId, flag } = req.body;

    if (!customerId || typeof flag !== "boolean") {
      return res.status(400).json({
        message: "customerId and boolean flag are required",
      });
    }

    const result = await sourceService.updateStage14(customerId, flag);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error.message?.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

async function getAllMasters(req, res) {
  try {
    const result = await sourceService.getAllMasters();

    return res.status(200).json({
      message: "Master data fetched successfully",
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function updateSource(req, res) {
  try {
    const { id } = req.params;
    const { name, commercial_commission, residential_commission } = req.body;

    const fabricator = await sourceService.updateSources(id, {
      name,
      commercial_commission,
      residential_commission,
    });
    return res.status(200).json({
      success: true,
      data: fabricator,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update fabricator",
    });
  }
}
async function updateSupervisor(req, res) {
  try {
    const { id } = req.params;
    const { name, commercial_commission, residential_commission } = req.body;

    const fabricator = await sourceService.updateSupervisor(id, {
      name,
      commercial_commission,
      residential_commission,
    });
    return res.status(200).json({
      success: true,
      data: fabricator,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update fabricator",
    });
  }
}
async function getCustomersBySource(req, res) {
  try {
    const sourceId = req.user.role_id;

    if (!sourceId) {
      return res.status(400).json({
        success: false,
        message: "sourceId is required",
      });
    }

    const data = await sourceService.getCustomersBySource(sourceId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

async function getPermissions(req, res) {
  try {
    const { customerId, leadId } = req.params;

    // ✅ Basic validation
    if (!customerId || !leadId) {
      return res.status(400).json({
        success: false,
        message: "customerId and leadId are required",
      });
    }

    const permissions = await sourceService.getPermissionsByCustomerAndLead(
      customerId,
      leadId,
    );

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions",
      error: error.message,
    });
  }
}

async function updatePermission(req, res) {
  try {
    const { permissionId } = req.params;
    const { is_permitted } = req.body;

    if (!permissionId) {
      return res.status(400).json({
        success: false,
        message: "permissionId is required",
      });
    }

    if (typeof is_permitted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_permitted must be true or false",
      });
    }

    const updatedPermission = await sourceService.updatePermission(
      permissionId,
      is_permitted,
    );

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: updatedPermission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update permission",
    });
  }
}

async function checkPermission(req, res) {
  try {
    const { customerId, pageId } = req.params; // or req.body

    if (!customerId || !pageId) {
      return res.status(400).json({
        success: false,
        message: "customerId and pageId are required",
      });
    }

    const isPermitted = await sourceService.checkPermissionForPage(
      customerId,
      pageId,
    );

    return res.status(200).json({
      success: true,
      data: { customerId, pageId, isPermitted },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check permission",
    });
  }
}

async function addWebLead(req, res) {
  try {
    const { name, mobile, address } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "name and mobile are required",
      });
    }

    const lead = await sourceService.addWebLead(req.body);

    // ✅ Handle "mobile already exists"
    if (lead === true) {
      return res.status(200).json({
        success: true,
        message: "Mobile already exists",
      });
    }

    // ✅ New lead created
    return res.status(201).json({
      success: true,
      message: "Web lead added successfully",
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function fetchAllWebLeads(req, res) {
  try {
    const leads = await sourceService.getAllWebLeads();

    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateWebLead(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const lead = await sourceService.updateWebLead(req.body);

    return res.status(200).json({
      success: true,
      message: "Web lead updated successfully",
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getPaidCommissionBySourceId(req, res) {
  try {
    const sourceId = req.user.role_id;

    const result = await sourceService.getPaidCommissionBySourceId(sourceId);

    return res.status(200).json({
      success: true,
      message: "Paid commission fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
async function getPaidCommissionByFabricatorId(req, res) {
  try {
    const sourceId = req.user.role_id;

    const result =
      await sourceService.getPaidCommissionByFabricatorId(sourceId);

    return res.status(200).json({
      success: true,
      message: "Paid commission fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
async function getPaidCommissionBySupervisorId(req, res) {
  try {
    const sourceId = req.user.role_id;

    const result =
      await sourceService.getPaidCommissionBySupervisorId(sourceId);

    return res.status(200).json({
      success: true,
      message: "Paid commission fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function getCompletionReport(req, res) {
  try {
    let { startDate, endDate } = req.query;

    // 🔹 call service (it already handles default current month)
    const result = await sourceService.getCompletionReport({
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      message: "Completion report fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function updateExtraCost(req, res) {
  try {
    const { id, extra_cost } = req.body;

    const result = await sourceService.updateExtraCostById(id, extra_cost);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function completeFinalStage(req, res) {
  try {
    const { finalStageId, customerId, leadId } = req.body;

    if (!finalStageId || !customerId || !leadId) {
      return res.status(400).json({
        success: false,
        message: "finalStageId, customerId, leadId are required",
      });
    }

    const result = await sourceService.completeFinalStage(
      finalStageId,
      customerId,
      leadId,
    );

    return res.status(200).json({
      success: true,
      message: "Final stage completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getCompletionSummary(req, res) {
  try {
    let { startDate, endDate } = req.query;

    // 🔹 Call service (handles default current month internally)
    const result = await sourceService.getCompletionSummary({
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      message: "Completion summary fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

module.exports = {
  fetchSources,
  addSource,
  getFinalStageCustomers,
  updateStage10,
  updateStage11,
  updateStage12,
  updateStage13,
  updateStage14,
  getAllMasters,
  fetchAllSources,
  updateSource,
  getCustomersBySource,
  getPermissions,
  updatePermission,
  checkPermission,
  addWebLead,
  fetchAllWebLeads,
  updateWebLead,
  getPaidCommissionBySourceId,
  getCompletionReport,
  updateExtraCost,
  fetchSupervisor,
  fetchAllSupervisor,
  addSupervisor,
  updateSupervisor,
  updateSupervisorViaId,
  completeFinalStage,
  getCompletionSummary,
  getFinalStageCustomersByStatus,
  getPaidCommissionByFabricatorId,
  getPaidCommissionBySupervisorId,
};
