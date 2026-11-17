// workers/whatsappFollowupWorker.js
const whatsappService = require("../services/whatsappService");
const whatsappFollowupService = require("../services/whatsappFollowupService");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const WORKER_ID = process.env.WHATSAPP_WORKER_ID || `worker-${process.pid}`;
const POLL_MS = Number(process.env.WHATSAPP_WORKER_POLL_MS) || 15_000;
const BATCH_SIZE = Number(process.env.WHATSAPP_WORKER_BATCH) || 10; // 10 per batch
const REAP_AFTER_MIN = Number(process.env.WHATSAPP_WORKER_REAP_MIN) || 10;

// Session-based socket: keep at 1 unless you've tested concurrency.
const SEND_CONCURRENCY = Number(process.env.WHATSAPP_WORKER_CONCURRENCY) || 1;
const SEND_GAP_MS = Number(process.env.WHATSAPP_WORKER_GAP_MS) || 3000;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let running = false;
let stopping = false;
let timer = null;
let tickInFlight = null;

// ---------------------------------------------------------------------------
// DUE: claim rows whose scheduled time has passed (oldest first).
// SKIP LOCKED makes it safe if more than one worker runs.
// ---------------------------------------------------------------------------
async function claimDueFollowups({ workerId, batchSize }) {
  const rows = await sequelize.query(
    `
    UPDATE whatsapp_followups
       SET status = 'processing',
           locked_by = :workerId,
           locked_at = NOW(),
           attempts = attempts + 1,
           updated_at = NOW()
     WHERE id IN (
       SELECT id
         FROM whatsapp_followups
        WHERE status = 'scheduled'
          AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT :batchSize
        FOR UPDATE SKIP LOCKED
     )
    RETURNING *
    `,
    { type: QueryTypes.SELECT, replacements: { workerId, batchSize } },
  );

  // RETURNING doesn't guarantee order
  return rows.sort(
    (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at),
  );
}

// ---------------------------------------------------------------------------
// Reaper — un-stick rows whose worker died mid-send
// ---------------------------------------------------------------------------
async function reapStuckFollowups() {
  const rows = await sequelize.query(
    `
    UPDATE whatsapp_followups
       SET status = 'scheduled',
           locked_by = NULL,
           locked_at = NULL,
           updated_at = NOW()
     WHERE status = 'processing'
       AND locked_at < NOW() - (:minutes || ' minutes')::interval
    RETURNING id, locked_by, attempts
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { minutes: REAP_AFTER_MIN },
    },
  );

  if (rows.length > 0) {
    console.warn(
      `[worker:${WORKER_ID}] reaped ${rows.length} stuck follow-up(s):`,
      rows.map((r) => r.id),
    );
  }
  return rows.length;
}

// ---------------------------------------------------------------------------
// Release claims we never attempted (shutdown, or already tried this tick).
// attempts is rolled back because no send was made.
// ---------------------------------------------------------------------------
async function releaseClaims(ids) {
  if (!ids.length) return;
  await sequelize.query(
    `
    UPDATE whatsapp_followups
       SET status = 'scheduled',
           locked_by = NULL,
           locked_at = NULL,
           attempts = GREATEST(attempts - 1, 0),
           updated_at = NOW()
     WHERE id IN (:ids) AND status = 'processing'
    `,
    { type: QueryTypes.UPDATE, replacements: { ids } },
  );
}

// ---------------------------------------------------------------------------
// Process one claimed follow-up
// ---------------------------------------------------------------------------
async function processOne(followup) {
  const started = Date.now();

  try {
    const result = await whatsappService.sendMessage(
      followup.whatsapp_number,
      followup.message,
    );

    await whatsappFollowupService.markFollowupSent({
      id: followup.id,
      provider_message_id: result?.messageId ?? null,
      provider_payload: {
        success: result?.success ?? true,
        number: result?.number ?? followup.whatsapp_number,
        jid: result?.jid ?? null,
        messageId: result?.messageId ?? null,
      },
    });

    await whatsappFollowupService.logFollowupSuccess({
      followup_id: followup.id,
      attempt_no: followup.attempts,
      http_status: null,
      response_body: {
        jid: result?.jid ?? null,
        messageId: result?.messageId ?? null,
      },
      duration_ms: Date.now() - started,
    });

    console.log(
      `[worker:${WORKER_ID}] sent followup=${followup.id} attempt=${followup.attempts} jid=${result?.jid} (${Date.now() - started}ms)`,
    );

    return { id: followup.id, status: "sent" };
  } catch (err) {
    const message = err?.message || String(err);

    console.error(
      `[worker:${WORKER_ID}] failed followup=${followup.id} attempt=${followup.attempts}: ${message}`,
    );

    try {
      await whatsappFollowupService.markFollowupFailed({
        id: followup.id,
        error: message,
        httpStatus: null,
        durationMs: Date.now() - started,
      });
    } catch (markErr) {
      console.error(
        `[worker:${WORKER_ID}] could not mark followup=${followup.id} failed:`,
        markErr.message,
      );
    }

    return { id: followup.id, status: "failed", error: message };
  }
}

// ---------------------------------------------------------------------------
// Send a batch with a gap + jitter between messages
// ---------------------------------------------------------------------------
async function processBatch(rows) {
  const results = [];
  let i = 0;

  const workers = Array.from(
    { length: Math.max(1, SEND_CONCURRENCY) },
    async () => {
      while (true) {
        if (stopping) return;
        const idx = i++;
        if (idx >= rows.length) return;
        results[idx] = await processOne(rows[idx]);

        if (i < rows.length) {
          const jitter = Math.floor(Math.random() * 2000);
          await new Promise((r) => setTimeout(r, SEND_GAP_MS + jitter));
        }
      }
    },
  );

  await Promise.all(workers);
  return results.filter(Boolean);
}

// ---------------------------------------------------------------------------
// One poll cycle: send everything that is due, 10 at a time
// ---------------------------------------------------------------------------
async function tick() {
  try {
    console.log(`[worker:${WORKER_ID}] tick @ ${new Date().toISOString()}`);
    await reapStuckFollowups();

    const seen = new Set(); // ids already attempted this tick
    let totalClaimed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    while (true) {
      if (stopping) break;

      const claimed = await claimDueFollowups({
        workerId: WORKER_ID,
        batchSize: BATCH_SIZE,
      });

      if (claimed.length === 0) break;

      // A failed row rescheduled into the past must not be re-sent this tick
      const fresh = claimed.filter((r) => !seen.has(r.id));
      const repeats = claimed.filter((r) => seen.has(r.id));

      if (repeats.length) await releaseClaims(repeats.map((r) => r.id));
      if (fresh.length === 0) break;

      fresh.forEach((r) => seen.add(r.id));
      totalClaimed += fresh.length;
      console.log(
        `[worker:${WORKER_ID}] claimed ${fresh.length} (total ${totalClaimed})`,
      );

      if (stopping) {
        await releaseClaims(fresh.map((r) => r.id));
        break;
      }

      const results = await processBatch(fresh);

      for (const r of results) {
        if (r.status === "sent") totalSent++;
        else if (r.status === "failed") totalFailed++;
      }

      // If we stopped mid-batch, give back the rows we never reached
      const done = new Set(results.map((r) => r.id));
      const unreached = fresh.filter((r) => !done.has(r.id));
      if (unreached.length) await releaseClaims(unreached.map((r) => r.id));
    }

    if (totalClaimed > 0) {
      console.log(
        `[worker:${WORKER_ID}] tick drained: claimed=${totalClaimed} sent=${totalSent} failed=${totalFailed}`,
      );
    }
  } catch (err) {
    console.error(`[worker:${WORKER_ID}] tick error:`, err);
  }
}

// ---------------------------------------------------------------------------
// Start / stop
// ---------------------------------------------------------------------------
function startWhatsappFollowupWorker() {
  if (running) {
    console.warn(`[worker:${WORKER_ID}] already running — ignoring start()`);
    return;
  }
  running = true;
  stopping = false;

  const loop = async () => {
    if (!running) return;
    tickInFlight = tick();
    try {
      await tickInFlight;
    } catch (_) {
      /* tick swallows */
    }
    tickInFlight = null;

    if (!running) return;
    timer = setTimeout(loop, POLL_MS);
  };

  console.log(
    `[worker:${WORKER_ID}] started (poll=${POLL_MS}ms, batch=${BATCH_SIZE}, concurrency=${SEND_CONCURRENCY}, reap=${REAP_AFTER_MIN}min)`,
  );
  loop();
}

async function stopWhatsappFollowupWorker() {
  if (!running) return;
  console.log(`[worker:${WORKER_ID}] stopping...`);
  stopping = true;
  running = false;

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (tickInFlight) {
    try {
      await tickInFlight;
    } catch (_) {
      /* ignore */
    }
  }

  console.log(`[worker:${WORKER_ID}] stopped`);
}

module.exports = {
  startWhatsappFollowupWorker,
  stopWhatsappFollowupWorker,
  _tick: tick,
  _reap: reapStuckFollowups,
  _processOne: processOne,
  _claimDue: claimDueFollowups,
};
