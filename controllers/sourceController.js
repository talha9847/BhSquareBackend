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
    const { name, commercial_commission } = req.body;

    const fabricator = await sourceService.updateSources(id, {
      name,
      commercial_commission,
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
};
