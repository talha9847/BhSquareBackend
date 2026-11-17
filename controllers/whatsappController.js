const whatsappService = require("../services/whatsappService");

function getWhatsAppQR(req, res) {
  return res.status(200).json({
    success: true,
    ...whatsappService.getWhatsAppStatus(),
  });
}

async function logoutWhatsApp(req, res) {
  try {
    const result = await whatsappService.disconnectWhatsApp();

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const sendMessage = async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({
        success: false,
        message: "Number and message are required",
      });
    }

    const result = await whatsappService.sendMessage(number, message);

    return res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send WhatsApp message",
    });
  }
};

const sharePdfDirectly = async (req, res) => {
  try {
    const { number, caption } = req.body;
    const file = req.file; // The PDF buffer from the frontend

    if (!number) {
      return res
        .status(400)
        .json({ success: false, message: "Number is required" });
    }
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "PDF file is required" });
    }

    // Pass the Buffer directly to your existing Baileys sendDocument function
    const result = await whatsappService.sendDocument(number, file.buffer, {
      fileName: file.originalname || "Estimation.pdf",
      mimetype: file.mimetype || "application/pdf",
      caption: caption || "Here is your solar estimation.",
    });

    return res.status(200).json({
      success: true,
      message: "PDF sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Share PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send PDF",
    });
  }
};

async function createFollowUpTemplate(req, res) {
  try {
    const { name, type, message } = req.body;

    if (!name?.trim() || !type || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "name, type and message are required",
      });
    }

    const result = await whatsappService.createFollowUpTemplate({
      name: name.trim(),
      type,
      message: message.trim(),
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating follow-up template:", error);

    if (error.parent?.code === "23505" || error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Template name already exists",
      });
    }

    if (error.parent?.code === "23514" || error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid template type",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create template",
    });
  }
}

// FETCH ALL
async function fetchAllFollowUpTemplates(req, res) {
  try {
    const result = await whatsappService.fetchFollowUpTemplates();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching follow-up templates:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch templates",
    });
  }
}

// FETCH BY ID
async function fetchFollowUpTemplateById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template id is required",
      });
    }

    const result = await whatsappService.fetchFollowUpTemplateById(id);

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching follow-up template:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch template",
    });
  }
}

// UPDATE
async function updateFollowUpTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name, type, message } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template id is required",
      });
    }

    if (!name?.trim() || !type || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "name, type and message are required",
      });
    }

    const result = await whatsappService.updateFollowUpTemplate({
      id,
      name: name.trim(),
      type,
      message: message.trim(),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating follow-up template:", error);

    if (error.parent?.code === "23505" || error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Template name already exists",
      });
    }

    if (error.parent?.code === "23514" || error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid template type",
      });
    }

    if (error.message === "Template not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update template",
    });
  }
}

// DELETE
async function deleteFollowUpTemplate(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template id is required",
      });
    }

    const result = await whatsappService.deleteFollowUpTemplate(id);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting follow-up template:", error);

    if (error.message === "Template not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete template",
    });
  }
}

module.exports = {
  getWhatsAppQR,
  logoutWhatsApp,
  sendMessage,
  sharePdfDirectly,

  createFollowUpTemplate,
  fetchAllFollowUpTemplates,
  fetchFollowUpTemplateById,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
};
