const express = require("express");

const router = express.Router();
const multer = require("multer");
const {
  getWhatsAppQR,
  logoutWhatsApp,
  sendMessage,
  sharePdfDirectly,
} = require("../controllers/whatsappController");
router.use((req, res, next) => {
  console.log(`[whatsapp-router] ${req.method} ${req.originalUrl}`);
  next();
});
const upload = multer({ storage: multer.memoryStorage() });

// Add your authentication middleware to these routes
router.get("/status", getWhatsAppQR);
// router.post("/logout", logoutWhatsApp);
router.post("/send", sendMessage);

router.post("/share-pdf", upload.single("pdf"), sharePdfDirectly);
console.log(
  "[whatsapp-router] loaded, routes:",
  router.stack
    .filter((l) => l.route)
    .map(
      (l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`,
    ),
);

module.exports = router;
