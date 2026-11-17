const express = require("express");
const multer = require("multer");
const {
  getWhatsAppQR,
  sendMessage,
  sharePdfDirectly,
} = require("../controllers/whatsappController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Add your authentication middleware to these routes
router.get("/status", getWhatsAppQR);
router.post("/send", sendMessage);
router.post("/share-pdf", upload.single("pdf"), sharePdfDirectly);

module.exports = router;
