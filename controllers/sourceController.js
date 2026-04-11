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

async function addSource(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "source_name is required",
      });
    }

    const source = await sourceService.addSource(name);

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
    console.error("Error fetching sources:", error);
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
    console.error("❌ Controller Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
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
    console.error("❌ Controller Error:", error);

    if (error.message.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
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
    console.error("❌ Controller Error:", error);

    if (error.message.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
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
    console.error("❌ Controller Error:", error);

    if (error.message.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
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
    console.error("❌ Controller Error:", error);

    if (error.message.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
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
    console.error("Error updating fabricator:", error);
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
    console.error("Error:", error);

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
    console.error("Controller Error:", error);

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
    console.error("Controller Error:", error);

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
    console.error("Error fetching web leads:", error);

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

    const result =
      await sourceService.getPaidCommissionBySourceId(sourceId);

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

module.exports = {
  fetchSources,
  addSource,
  getFinalStageCustomers,
  updateStage10,
  updateStage11,
  updateStage12,
  updateStage13,
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
};
