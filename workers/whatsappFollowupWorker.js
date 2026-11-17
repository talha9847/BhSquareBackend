// workers/whatsappFollowupWorker.js
const whatsappService = require("../services/whatsappService"); // your existing service
const whatsappFollowupService = require("../services/whatsappFollowupService");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const WORKER_ID = process.env.WHATSAPP_WORKER_ID || `worker-${process.pid}`;
const POLL_MS = Number(process.env.WHATSAPP_WORKER_POLL_MS) || 15_000;
const BATCH_SIZE = Number(process.env.WHATSAPP_WORKER_BATCH) || 20;
const REAP_AFTER_MIN = Number(process.env.WHATSAPP_WORKER_REAP_MIN) || 10;

// Your session-based socket can't send N messages in parallel safely.
// Keep this at 1 unless you've tested concurrency with your provider.
const SEND_CONCURRENCY = Number(process.env.WHATSAPP_WORKER_CONCURRENCY) || 1;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let running = false;
let stopping = false;
let timer = null;
let tickInFlight = null;

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
// Process one claimed follow-up.
// Uses your existing whatsappService.sendMessage(number, message).
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
      http_status: null, // session-based, no HTTP status
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
// Small concurrency helper (cap = SEND_CONCURRENCY)
// ---------------------------------------------------------------------------
const SEND_GAP_MS = Number(process.env.WHATSAPP_WORKER_GAP_MS) || 3000;

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

        // gap between sends (jitter avoids machine-pattern detection)
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
// Release claims we didn't get to (on shutdown mid-batch)
// ---------------------------------------------------------------------------
async function releaseClaims(ids) {
  if (!ids.length) return;
  await sequelize.query(
    `
    UPDATE whatsapp_followups
       SET status = 'scheduled',
           locked_by = NULL,
           locked_at = NULL,
           updated_at = NOW()
     WHERE id IN (:ids) AND status = 'processing'
    `,
    { type: QueryTypes.UPDATE, replacements: { ids } },
  );
}

// ---------------------------------------------------------------------------
// One poll cycle
// ---------------------------------------------------------------------------
async function tick() {
  try {
    console.log(`[worker:${WORKER_ID}] tick @ ${new Date().toISOString()}`);
    await reapStuckFollowups();

    let totalClaimed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // Drain the queue — keep claiming batches until nothing is due
    while (true) {
      if (stopping) break;

      const claimed = await whatsappFollowupService.claimDueFollowups({
        workerId: WORKER_ID,
        batchSize: BATCH_SIZE,
      });

      if (claimed.length === 0) break;

      totalClaimed += claimed.length;
      console.log(
        `[worker:${WORKER_ID}] claimed ${claimed.length} (total ${totalClaimed})`,
      );

      if (stopping) {
        await releaseClaims(claimed.map((r) => r.id));
        break;
      }

      const results = await processBatch(claimed);
      for (const r of results) {
        if (r.status === "sent") totalSent++;
        else if (r.status === "failed") totalFailed++;
      }
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
};
