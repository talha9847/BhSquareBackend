// services/whatsappFollowupService.js
const sequelize = require("../config/db"); // adjust import to your setup
const { QueryTypes } = require("sequelize");
const { randomUUID } = require("crypto");

// ---------------------------------------------------------------------------
// 1. CREATE / SCHEDULE a follow-up
// ---------------------------------------------------------------------------
async function scheduleFollowup({
  lead_id,
  whatsapp_number,
  template_id = null,
  message, // FINAL rendered text (caller resolves placeholders)
  scheduled_at, // Date or ISO string (UTC)
  timezone = "Asia/Kolkata",
  max_attempts = 3,
  created_by = null,
  idempotency_key = null, // pass one if you want caller-controlled dedupe
}) {
  const idem = idempotency_key || randomUUID();

  let utc;
  if (scheduled_at instanceof Date) {
    utc = scheduled_at.toISOString();
  } else if (typeof scheduled_at === "string" && scheduled_at.includes("T")) {
    // ISO from frontend, already UTC ("...Z")
    utc = new Date(scheduled_at).toISOString();
  } else {
    // "2026-11-17 15:02:00" — assume IST
    utc = new Date(
      String(scheduled_at).replace(" ", "T") + "+05:30",
    ).toISOString();
  }
  const scheduledUtc = utc.slice(0, 19).replace("T", " ");

  // Snapshot template name if a template was used
  let template_name = null;
  if (template_id) {
    const [tpl] = await sequelize.query(
      `SELECT name FROM follow_up_templates WHERE id = :template_id`,
      {
        type: QueryTypes.SELECT,
        replacements: { template_id },
      },
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
      SET updated_at = NOW()
    RETURNING *
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        lead_id,
        whatsapp_number,
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
// 3. LIST follow-ups by WhatsApp number (per-contact history / rate limit)
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
      replacements: { whatsapp_number, limit },
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
           cancelled_at = NOW(),
           updated_at = NOW()
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
//    Postgres: SELECT ... FOR UPDATE SKIP LOCKED in a short transaction.
//    MySQL:    same syntax works on 8.0+ (SKIP LOCKED supported).
// ---------------------------------------------------------------------------
async function claimDueFollowups({ workerId, batchSize = 20 }) {
  return sequelize.transaction(async (t) => {
    // 1) select+lock rows that are due
    const due = await sequelize.query(
      `
      SELECT id
      FROM whatsapp_followups
      WHERE status = 'scheduled'
        AND run_at <= NOW()
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

    // 2) flip them to 'processing' and stamp the lock
    const claimed = await sequelize.query(
      `
      UPDATE whatsapp_followups
         SET status = 'processing',
             locked_by = :workerId,
             locked_at = NOW(),
             attempts = attempts + 1,
             updated_at = NOW()
       WHERE id IN (:ids)
      RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { workerId, ids },
        transaction: t,
      },
    );

    return claimed;
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
           sent_at = NOW(),
           provider_message_id = :provider_message_id,
           provider_payload = :provider_payload,
           locked_by = NULL,
           locked_at = NULL,
           updated_at = NOW()
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
// 7. MARK FAILED  (with retry/backoff, or final failure if attempts exhausted)
//    Backoff: 1m, 5m, 15m, 1h ... capped. Adjust to taste.
// ---------------------------------------------------------------------------
async function markFollowupFailed({
  id,
  error,
  httpStatus = null,
  durationMs = null,
}) {
  return sequelize.transaction(async (t) => {
    const [row] = await sequelize.query(
      `SELECT * FROM whatsapp_followups WHERE id = :id FOR UPDATE`,
      {
        type: QueryTypes.SELECT,
        replacements: { id },
        transaction: t,
      },
    );
    if (!row) return null;

    const exhausted = row.attempts >= row.max_attempts;

    if (exhausted) {
      const [failed] = await sequelize.query(
        `
        UPDATE whatsapp_followups
           SET status = 'failed',
               failed_at = NOW(),
               last_error = :error,
               locked_by = NULL,
               locked_at = NULL,
               updated_at = NOW()
         WHERE id = :id
        RETURNING *
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { id, error: String(error || "unknown error") },
          transaction: t,
        },
      );
      return failed;
    }

    // retry: exponential backoff in minutes
    const backoffMinutes = Math.min(60, 2 ** (row.attempts - 1)); // 1,2,4,8,16,32,60
    const [retry] = await sequelize.query(
      `
      UPDATE whatsapp_followups
         SET status = 'scheduled',
             run_at = NOW() + (:backoffMinutes || ' minutes')::interval,
             last_error = :error,
             locked_by = NULL,
             locked_at = NULL,
             updated_at = NOW()
       WHERE id = :id
      RETURNING *
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          id,
          error: String(error || "unknown error"),
          backoffMinutes,
        },
        transaction: t,
      },
    );

    // also log the failed attempt
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
          error_message: String(error || "unknown error"),
          duration_ms: durationMs,
        },
        transaction: t,
      },
    );

    return retry;
  });
}

// ---------------------------------------------------------------------------
// 8. LOG a successful attempt (called alongside markFollowupSent by worker)
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
      (:followup_id, :attempt_no, 'success', :http_status, :response_body, :duration_ms)
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
// 9. RECONCILE by provider_message_id (webhook callback)
// ---------------------------------------------------------------------------
async function findFollowupByProviderMessageId(provider_message_id) {
  const [row] = await sequelize.query(
    `SELECT * FROM whatsapp_followups WHERE provider_message_id = :pid LIMIT 1`,
    {
      type: QueryTypes.SELECT,
      replacements: { pid: provider_message_id },
    },
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
