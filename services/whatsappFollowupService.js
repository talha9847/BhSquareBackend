// services/whatsappFollowupService.js
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");
const { randomUUID } = require("crypto");

// Your columns are TIMESTAMP (no tz) and hold UTC. Plain NOW() is timestamptz
// and gets converted using the DB session timezone, so on a non-UTC session
// every comparison/write is shifted. Always use this instead of NOW().
const UTC_NOW = "(NOW() AT TIME ZONE 'UTC')";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Returns "YYYY-MM-DD HH:mm:ss" in UTC.
// - Date objects and strings with Z / +05:30 are used as-is.
// - Strings with NO zone ("2026-11-17 15:02:00", "2026-11-17T15:02") are IST.
function toUtcString(input) {
  let d;
  if (input instanceof Date) {
    d = input;
  } else {
    const s = String(input).trim().replace(" ", "T");
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
    d = new Date(hasZone ? s : s + "+05:30");
  }
  if (Number.isNaN(d.getTime())) throw new Error("Invalid scheduled_at");
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// Your CHECK needs digits only, country code first: ^[1-9][0-9]{7,14}$
function normalizeNumber(n) {
  let digits = String(n || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits; // bare Indian number
  return digits;
}

// ---------------------------------------------------------------------------
// 1. CREATE / SCHEDULE a follow-up
// ---------------------------------------------------------------------------
async function scheduleFollowup({
  lead_id,
  whatsapp_number,
  template_id = null,
  message,
  scheduled_at,
  timezone = "Asia/Kolkata",
  max_attempts = 3,
  created_by = null,
  idempotency_key = null,
}) {
  const idem = idempotency_key || randomUUID();
  const scheduledUtc = toUtcString(scheduled_at);

  let template_name = null;
  if (template_id) {
    const [tpl] = await sequelize.query(
      `SELECT name FROM follow_up_templates WHERE id = :template_id`,
      { type: QueryTypes.SELECT, replacements: { template_id } },
    );
    template_name = tpl ? tpl.name : null;
  }

  const [row] = await sequelize.query(
    `
    INSERT INTO whatsapp_followups (
      lead_id, whatsapp_number, template_id, template_name, message,
      scheduled_at, run_at, timezone, max_attempts, idempotency_key, created_by
    )
    VALUES (
      :lead_id, :whatsapp_number, :template_id, :template_name, :message,
      :scheduled_at, :scheduled_at, :timezone, :max_attempts, :idempotency_key, :created_by
    )
    ON CONFLICT (idempotency_key) DO UPDATE
      SET updated_at = ${UTC_NOW}
    RETURNING *
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        lead_id,
        whatsapp_number: normalizeNumber(whatsapp_number),
        template_id,
        template_name,
        message,
        scheduled_at: scheduledUtc,
        timezone,
        max_attempts,
        idempotency_key: idem,
        created_by,
      },
    },
  );

  return row;
}

// ---------------------------------------------------------------------------
// 2. LIST follow-ups for a lead
// ---------------------------------------------------------------------------
async function listFollowupsByLead(lead_id, { status = null } = {}) {
  const where = ["lead_id = :lead_id"];
  const replacements = { lead_id };
  if (status) {
    where.push("status = :status");
    replacements.status = status;
  }

  return sequelize.query(
    `
    SELECT *
    FROM whatsapp_followups
    WHERE ${where.join(" AND ")}
    ORDER BY scheduled_at DESC
    `,
    { type: QueryTypes.SELECT, replacements },
  );
}

// ---------------------------------------------------------------------------
// 3. LIST follow-ups by WhatsApp number
// ---------------------------------------------------------------------------
async function listFollowupsByNumber(whatsapp_number, { limit = 50 } = {}) {
  return sequelize.query(
    `
    SELECT *
    FROM whatsapp_followups
    WHERE whatsapp_number = :whatsapp_number
    ORDER BY scheduled_at DESC
    LIMIT :limit
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { whatsapp_number: normalizeNumber(whatsapp_number), limit },
    },
  );
}

// ---------------------------------------------------------------------------
// 4. CANCEL a follow-up (only if still scheduled)
// ---------------------------------------------------------------------------
async function cancelFollowup(id) {
  const [row] = await sequelize.query(
    `
    UPDATE whatsapp_followups
       SET status = 'cancelled',
           cancelled_at = ${UTC_NOW}
     WHERE id = :id
       AND status = 'scheduled'
    RETURNING *
    `,
    { type: QueryTypes.SELECT, replacements: { id } },
  );
  return row || null;
}

// ---------------------------------------------------------------------------
// 5. CLAIM due follow-ups (worker entry point)
//    Due = run_at has passed, status is 'scheduled' (retries are put back to
//    'scheduled' by markFollowupFailed), and attempts are not exhausted.
// ---------------------------------------------------------------------------
async function claimDueFollowups({ workerId, batchSize = 10 }) {
  return sequelize.transaction(async (t) => {
    const due = await sequelize.query(
      `
      SELECT id
      FROM whatsapp_followups
      WHERE status = 'scheduled'
        AND run_at <= ${UTC_NOW}
        AND attempts < max_attempts
      ORDER BY run_at ASC
      LIMIT :batchSize
      FOR UPDATE SKIP LOCKED
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { batchSize },
        transaction: t,
      },
    );

    if (due.length === 0) return [];

    const ids = due.map((r) => r.id);

    const claimed = await sequelize.query(
      `
      UPDATE whatsapp_followups
         SET status = 'processing',
             locked_by = :workerId,
             locked_at = ${UTC_NOW},
             attempts = attempts + 1
       WHERE id IN (:ids)
      RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { workerId, ids },
        transaction: t,
      },
    );

    // RETURNING doesn't guarantee order — send oldest first
    return claimed.sort((a, b) => new Date(a.run_at) - new Date(b.run_at));
  });
}

// ---------------------------------------------------------------------------
// 6. MARK SENT
// ---------------------------------------------------------------------------
async function markFollowupSent({
  id,
  provider_message_id = null,
  provider_payload = null,
}) {
  const [row] = await sequelize.query(
    `
    UPDATE whatsapp_followups
       SET status = 'sent',
           sent_at = ${UTC_NOW},
           failed_at = NULL,
           last_error = NULL,
           provider_message_id = :provider_message_id,
           provider_payload = CAST(:provider_payload AS JSONB),
           locked_by = NULL,
           locked_at = NULL
     WHERE id = :id
    RETURNING *
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        id,
        provider_message_id,
        provider_payload: provider_payload
          ? JSON.stringify(provider_payload)
          : null,
      },
    },
  );
  return row || null;
}

// ---------------------------------------------------------------------------
// 7. MARK FAILED (retry with backoff, or final failure when exhausted)
//    The attempt is logged in BOTH cases (before, only retries were logged).
// ---------------------------------------------------------------------------
async function markFollowupFailed({
  id,
  error,
  httpStatus = null,
  durationMs = null,
}) {
  const errorText = String(error || "unknown error");

  return sequelize.transaction(async (t) => {
    const [row] = await sequelize.query(
      `SELECT * FROM whatsapp_followups WHERE id = :id FOR UPDATE`,
      { type: QueryTypes.SELECT, replacements: { id }, transaction: t },
    );
    if (!row) return null;

    // log this attempt first, whatever happens next
    await sequelize.query(
      `
      INSERT INTO whatsapp_followup_logs
        (followup_id, attempt_no, status, http_status, error_message, duration_ms)
      VALUES
        (:followup_id, :attempt_no, 'failed', :http_status, :error_message, :duration_ms)
      ON CONFLICT (followup_id, attempt_no) DO NOTHING
      `,
      {
        type: QueryTypes.INSERT,
        replacements: {
          followup_id: id,
          attempt_no: row.attempts,
          http_status: httpStatus,
          error_message: errorText,
          duration_ms: durationMs,
        },
        transaction: t,
      },
    );

    if (row.attempts >= row.max_attempts) {
      const [failed] = await sequelize.query(
        `
        UPDATE whatsapp_followups
           SET status = 'failed',
               failed_at = ${UTC_NOW},
               last_error = :error,
               locked_by = NULL,
               locked_at = NULL
         WHERE id = :id
        RETURNING *
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { id, error: errorText },
          transaction: t,
        },
      );
      return failed;
    }

    // retry: exponential backoff in minutes (1, 2, 4, 8 ... capped at 60)
    const backoffMinutes = Math.min(60, 2 ** (row.attempts - 1));
    const [retry] = await sequelize.query(
      `
      UPDATE whatsapp_followups
         SET status = 'scheduled',
             run_at = ${UTC_NOW} + make_interval(mins => :backoffMinutes),
             last_error = :error,
             locked_by = NULL,
             locked_at = NULL
       WHERE id = :id
      RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { id, error: errorText, backoffMinutes },
        transaction: t,
      },
    );
    return retry;
  });
}

// ---------------------------------------------------------------------------
// 8. LOG a successful attempt
// ---------------------------------------------------------------------------
async function logFollowupSuccess({
  followup_id,
  attempt_no,
  http_status = 200,
  response_body = null,
  duration_ms = null,
}) {
  const [row] = await sequelize.query(
    `
    INSERT INTO whatsapp_followup_logs
      (followup_id, attempt_no, status, http_status, response_body, duration_ms)
    VALUES
      (:followup_id, :attempt_no, 'success', :http_status, CAST(:response_body AS JSONB), :duration_ms)
    ON CONFLICT (followup_id, attempt_no) DO NOTHING
    RETURNING *
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        followup_id,
        attempt_no,
        http_status,
        response_body: response_body ? JSON.stringify(response_body) : null,
        duration_ms,
      },
    },
  );
  return row || null;
}

// ---------------------------------------------------------------------------
// 9. RECONCILE by provider_message_id
// ---------------------------------------------------------------------------
async function findFollowupByProviderMessageId(provider_message_id) {
  const [row] = await sequelize.query(
    `SELECT * FROM whatsapp_followups WHERE provider_message_id = :pid LIMIT 1`,
    { type: QueryTypes.SELECT, replacements: { pid: provider_message_id } },
  );
  return row || null;
}

module.exports = {
  scheduleFollowup,
  listFollowupsByLead,
  listFollowupsByNumber,
  cancelFollowup,
  claimDueFollowups,
  markFollowupSent,
  markFollowupFailed,
  logFollowupSuccess,
  findFollowupByProviderMessageId,
};