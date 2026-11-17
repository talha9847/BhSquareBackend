const express = require("express");

const router = express.Router();
const multer = require("multer");
const {
  getWhatsAppQR,
  logoutWhatsApp,
  sendMessage,
  sharePdfDirectly,
} = require("../controllers/whatsappController");

const upload = multer({ storage: multer.memoryStorage() });

// Add your authentication middleware to these routes
router.get("/status", getWhatsAppQR);
// router.post("/logout", logoutWhatsApp);
router.post("/send", sendMessage);

router.post("/share-pdf", upload.single("pdf"), sharePdfDirectly);

module.exports = router;
