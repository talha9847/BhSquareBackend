// controllers/whatsappFollowupController.js
const whatsappFollowupService = require("../services/whatsappFollowupService");

// ---------------------------------------------------------------------------
// POST /api/whatsapp-followups
// Schedule a follow-up. Caller sends the FINAL rendered message.
// ---------------------------------------------------------------------------
async function addFollowup(req, res) {
  try {
    const {
      lead_id,
      whatsapp_number,
      template_id = null,
      message,
      scheduled_at,
      timezone = "Asia/Kolkata",
      max_attempts = 3,
      idempotency_key = null,
    } = req.body;

    // --- validation ---
    if (!lead_id) {
      return res
        .status(400)
        .json({ success: false, message: "lead_id is required" });
    }
    if (!whatsapp_number) {
      return res
        .status(400)
        .json({ success: false, message: "whatsapp_number is required" });
    }
    if (!/^[1-9][0-9]{7,14}$/.test(String(whatsapp_number))) {
      return res.status(400).json({
        success: false,
        message:
          "whatsapp_number must be digits only, with country code, no '+' or leading zero",
      });
    }
    if (!message || !String(message).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "message is required" });
    }
    if (!scheduled_at) {
      return res
        .status(400)
        .json({ success: false, message: "scheduled_at is required" });
    }
    const when = new Date(scheduled_at);
    if (isNaN(when.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "scheduled_at is not a valid date" });
    }
    if (max_attempts < 1 || max_attempts > 10) {
      return res.status(400).json({
        success: false,
        message: "max_attempts must be between 1 and 10",
      });
    }

    // --- create ---
    const row = await whatsappFollowupService.scheduleFollowup({
      lead_id,
      whatsapp_number: String(whatsapp_number),
      template_id,
      message: String(message),
      scheduled_at: when, // UTC
      timezone,
      max_attempts,
      created_by: req.user?.id ?? null,
      idempotency_key,
    });

    return res.status(201).json({
      success: true,
      message: "Follow-up scheduled successfully",
      data: row,
    });
  } catch (error) {
    console.error("Error scheduling follow-up:", error);
    // unique violation on idempotency_key
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Duplicate follow-up (idempotency_key already used)",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/whatsapp-followups/lead/:lead_id?status=scheduled
// List a lead's follow-ups
// ---------------------------------------------------------------------------
async function fetchFollowupsByLead(req, res) {
  try {
    const { lead_id } = req.params;
    const { status = null } = req.query;

    const allowed = ["scheduled", "processing", "sent", "failed", "cancelled"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const rows = await whatsappFollowupService.listFollowupsByLead(
      Number(lead_id),
      { status },
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/whatsapp-followups/number/:number?limit=50
// Per-contact history (useful for UI + rate limiting checks)
// ---------------------------------------------------------------------------
async function fetchFollowupsByNumber(req, res) {
  try {
    const { number } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    if (!/^[1-9][0-9]{7,14}$/.test(String(number))) {
      return res.status(400).json({
        success: false,
        message: "Invalid whatsapp number format",
      });
    }

    const rows = await whatsappFollowupService.listFollowupsByNumber(number, {
      limit,
    });

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching follow-ups by number:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/whatsapp-followups/:id/cancel
// Cancel a scheduled follow-up (no-op if already sent/failed)
// ---------------------------------------------------------------------------
async function cancelFollowup(req, res) {
  try {
    const { id } = req.params;

    const row = await whatsappFollowupService.cancelFollowup(Number(id));

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found or not in 'scheduled' state",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Follow-up cancelled successfully",
      data: row,
    });
  } catch (error) {
    console.error("Error cancelling follow-up:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/whatsapp-followups/:id
// Fetch a single follow-up (for detail view / status polling)
// ---------------------------------------------------------------------------
async function fetchFollowupById(req, res) {
  try {
    const { id } = req.params;
    const row = (await whatsappFollowupService.findFollowupByProviderMessageId)
      ? null
      : null;

    // use the service's generic lookup (add findFollowupById if you want one)
    const { sequelize } = require("../models");
    const { QueryTypes } = require("sequelize");
    const [found] = await sequelize.query(
      `SELECT * FROM whatsapp_followups WHERE id = :id LIMIT 1`,
      { type: QueryTypes.SELECT, replacements: { id: Number(id) } },
    );

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    return res.status(200).json({ success: true, data: found });
  } catch (error) {
    console.error("Error fetching follow-up:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// ---------------------------------------------------------------------------
// GET /api/whatsapp-followups/:id/logs
// Attempt log history for a follow-up
// ---------------------------------------------------------------------------
async function fetchFollowupLogs(req, res) {
  try {
    const { id } = req.params;
    const { sequelize } = require("../models");
    const { QueryTypes } = require("sequelize");

    const rows = await sequelize.query(
      `
      SELECT *
      FROM whatsapp_followup_logs
      WHERE followup_id = :id
      ORDER BY attempt_no ASC
      `,
      { type: QueryTypes.SELECT, replacements: { id: Number(id) } },
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching follow-up logs:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  addFollowup,
  fetchFollowupsByLead,
  fetchFollowupsByNumber,
  cancelFollowup,
  fetchFollowupById,
  fetchFollowupLogs,
};
