// routes/whatsappFollowupRoutes.js
const express = require("express");
const router = express.Router();

const whatsappFollowupController = require("../controllers/whatsappFollowupController");
const middleware = require("../middlewares/authMiddleware");

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------
// POST /api/whatsapp-followups
// body: { lead_id, whatsapp_number, template_id?, message, scheduled_at,
//         timezone?, max_attempts?, idempotency_key? }
router.post(
  "/",
  middleware.authMiddleware(["admin"]),
  whatsappFollowupController.addFollowup,
);

// ---------------------------------------------------------------------------
// Lookup by lead / by contact number
// ---------------------------------------------------------------------------
// GET /api/whatsapp-followups/lead/:lead_id?status=scheduled
router.get(
  "/lead/:lead_id",
  middleware.authMiddleware(["admin"]),
  whatsappFollowupController.fetchFollowupsByLead,
);

// GET /api/whatsapp-followups/number/:number?limit=50
router.get(
  "/number/:number",
  middleware.authMiddleware(["admin"]),
  whatsappFollowupController.fetchFollowupsByNumber,
);

// ---------------------------------------------------------------------------
// Single follow-up + attempt log
// NOTE: must come AFTER /lead and /number or ":id" swallows them.
// ---------------------------------------------------------------------------
// GET /api/whatsapp-followups/:id
router.get(
  "/:id",
  middleware.authMiddleware(["admin"]),
  whatsappFollowupController.fetchFollowupById,
);

// GET /api/whatsapp-followups/:id/logs
router.get(
  "/:id/logs",
  middleware.authMiddleware(["admin"]),
  whatsappFollowupController.fetchFollowupLogs,
);

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
// PATCH /api/whatsapp-followups/:id/cancel
router.patch(
  "/:id/cancel",
  middleware.authMiddleware(["admin"]),
  whatsappFollowupController.cancelFollowup,
);

module.exports = router;
