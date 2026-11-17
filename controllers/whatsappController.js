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

module.exports = {
  getWhatsAppQR,
  logoutWhatsApp,
  sendMessage,
  sharePdfDirectly,
};
