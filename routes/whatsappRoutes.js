const express = require("express");
const multer = require("multer");
const {
  getWhatsAppQR,
  sendMessage,
  sharePdfDirectly,

  // follow-up templates
  createFollowUpTemplate,
  fetchAllFollowUpTemplates,
  fetchFollowUpTemplateById,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
} = require("../controllers/whatsappController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// =====================================================
// WHATSAPP
// =====================================================
router.get("/status", getWhatsAppQR);
router.post("/send", sendMessage);
router.post("/share-pdf", upload.single("pdf"), sharePdfDirectly);

// =====================================================
// FOLLOW-UP TEMPLATES
// =====================================================
router.get("/templates/fetchAll", fetchAllFollowUpTemplates);
router.get("/templates/:id", fetchFollowUpTemplateById);
router.post("/templates/add", createFollowUpTemplate);
router.put("/templates/update/:id", updateFollowUpTemplate);
router.delete("/templates/delete/:id", deleteFollowUpTemplate);

module.exports = router;
