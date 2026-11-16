const express = require("express");

const router = express.Router();

const {
  
  getWhatsAppQR,
  logoutWhatsApp,
  sendMessage,
} = require("../controllers/whatsappController");

// Add your authentication middleware to these routes
router.get("/status", getWhatsAppQR);
// router.post("/logout", logoutWhatsApp);
router.post("/send", sendMessage);

module.exports = router;
