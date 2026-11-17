const sequelize = require("../config/db");
const QRCode = require("qrcode");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");

const sessions = new Map();

const QR_PATH = path.join(process.cwd(), "qr.png");
const SESSION_ID = process.env.BAILEYS_SESSION_ID || "rayvolts-dev";
const DEFAULT_COUNTRY_CODE = process.env.WA_DEFAULT_COUNTRY_CODE || "91";

const SEND_TIMEOUT_MS = 30000;
const LOOKUP_TIMEOUT_MS = 15000;
const READY_WAIT_MS = 25000;
const JID_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DB_CHUNK_SIZE = 500;
const LOAD_RETRIES = 5;
const START_RETRY_MS = 15000;

// number -> { jid, expires }
const jidCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =====================================================
// GENERIC HELPERS
// =====================================================

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function chunk(arr, size = DB_CHUNK_SIZE) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function restoreJSON(value, BufferJSON) {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver);
}

function serializeJSON(value, BufferJSON) {
  return JSON.stringify(value, BufferJSON.replacer);
}

// =====================================================
// NUMBER HELPERS
// =====================================================

// Strips symbols/leading zeros and adds the country code to 10-digit numbers.
function normalizeNumber(number) {
  let n = String(number || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");
  if (n.length === 10) n = DEFAULT_COUNTRY_CODE + n;
  return n;
}

// Confirms the number is on WhatsApp and returns the real JID.
// Results are cached so repeat sends skip the network lookup.
async function resolveJid(sock, number) {
  const n = normalizeNumber(number);

  if (n.length < 11 || n.length > 15) {
    throw new Error(`Invalid phone number: ${n || "(empty)"}`);
  }

  const cached = jidCache.get(n);
  if (cached && cached.expires > Date.now()) {
    return { jid: cached.jid, number: n };
  }

  const results = await withTimeout(
    sock.onWhatsApp(n),
    LOOKUP_TIMEOUT_MS,
    "onWhatsApp lookup",
  );
  const found = results?.[0];

  if (!found?.exists) {
    throw new Error(`${n} is not registered on WhatsApp`);
  }

  jidCache.set(n, { jid: found.jid, expires: Date.now() + JID_CACHE_TTL_MS });
  return { jid: found.jid, number: n };
}

// Waits for the session to become ready (covers Render wake-up and reconnects).
async function getReadySession(timeoutMs = READY_WAIT_MS) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const session = sessions.get(SESSION_ID);

    if (!session) {
      throw new Error("WhatsApp session not initialized");
    }

    if (
      session.socket &&
      (session.status === "connected" ||
        session.status === "connected_unpersisted")
    ) {
      return session;
    }

    // These states will not fix themselves by waiting.
    if (
      ["qr_pending", "authentication_required", "replaced"].includes(
        session.status,
      )
    ) {
      throw new Error(`WhatsApp needs attention (status: ${session.status})`);
    }

    await sleep(500);
  }

  const session = sessions.get(SESSION_ID);
  throw new Error(
    `WhatsApp is not connected (status: ${session?.status || "unknown"}). Try again in a few seconds.`,
  );
}

// =====================================================
// LOAD AUTH STATE FROM DATABASE
//
// IMPORTANT: this function never swallows errors. A database
// problem must NOT be mistaken for "no saved session", because
// that would start a fresh login and replace the real one.
// Fresh credentials are created only when the query succeeded
// and returned no rows.
// =====================================================

async function loadAuthState(session, baileys) {
  const { BufferJSON, initAuthCreds } = baileys;

  const rows = await sequelize.query(
    `SELECT creds
     FROM baileys_sessions
     WHERE session_id = :sessionId`,
    {
      replacements: { sessionId: session.id },
      type: sequelize.QueryTypes.SELECT,
    },
  );

  const hasCreds =
    rows.length > 0 &&
    rows[0].creds &&
    typeof rows[0].creds === "object" &&
    Object.keys(rows[0].creds).length > 0;

  if (!hasCreds) {
    console.log("No saved session found. Initializing fresh authentication...");
    session.persisted = false;
    return initAuthCreds();
  }

  console.log("Restoring WhatsApp session from database...");

  const creds = restoreJSON(rows[0].creds, BufferJSON);

  const keyRows = await sequelize.query(
    `SELECT key_type, key_id, key_data
     FROM baileys_auth_keys
     WHERE session_id = :sessionId`,
    {
      replacements: { sessionId: session.id },
      type: sequelize.QueryTypes.SELECT,
    },
  );

  const restored = new Map();
  for (const row of keyRows) {
    if (!restored.has(row.key_type)) {
      restored.set(row.key_type, new Map());
    }
    restored
      .get(row.key_type)
      .set(row.key_id, restoreJSON(row.key_data, BufferJSON));
  }

  // Swap in only after everything loaded without errors.
  session.keys = restored;

  console.log(`Restored ${keyRows.length} auth key(s) from database.`);

  session.persisted = true;
  return creds;
}

async function loadAuthStateWithRetry(session, baileys) {
  for (let attempt = 1; attempt <= LOAD_RETRIES; attempt++) {
    try {
      return await loadAuthState(session, baileys);
    } catch (error) {
      console.error(
        `Auth load failed (attempt ${attempt}/${LOAD_RETRIES}):`,
        error.message,
      );
      if (attempt === LOAD_RETRIES) throw error;
      await sleep(2000 * attempt);
    }
  }
}

// =====================================================
// PERSISTENCE (incremental + batched)
// =====================================================

// Serialize all DB writes. A failed write never breaks the chain.
function enqueue(session, task) {
  const run = (session.savePromise || Promise.resolve())
    .catch(() => {})
    .then(task);
  session.savePromise = run.catch(() => {});
  return run;
}

// Creds only: 1 query.
async function persistCreds(session, transaction) {
  const { BufferJSON } = session.baileys;

  await sequelize.query(
    `INSERT INTO baileys_sessions (session_id, creds)
     VALUES (:sessionId, CAST(:creds AS JSONB))
     ON CONFLICT (session_id)
     DO UPDATE SET
       creds = EXCLUDED.creds,
       updated_at = CURRENT_TIMESTAMP`,
    {
      replacements: {
        sessionId: session.id,
        creds: serializeJSON(session.auth.creds, BufferJSON),
      },
      transaction,
    },
  );
}

// Changed keys only: 1 query per DB_CHUNK_SIZE keys.
async function persistKeyChanges(session, upserts, deletes, transaction) {
  const { BufferJSON } = session.baileys;

  for (const part of chunk(upserts)) {
    await sequelize.query(
      `INSERT INTO baileys_auth_keys (session_id, key_type, key_id, key_data)
       SELECT :sessionId, x.t, x.i, x.d::jsonb
       FROM unnest(ARRAY[:types]::text[], ARRAY[:ids]::text[], ARRAY[:datas]::text[])
            AS x(t, i, d)
       ON CONFLICT (session_id, key_type, key_id)
       DO UPDATE SET
         key_data = EXCLUDED.key_data,
         updated_at = CURRENT_TIMESTAMP`,
      {
        replacements: {
          sessionId: session.id,
          types: part.map((k) => k.type),
          ids: part.map((k) => String(k.id)),
          datas: part.map((k) => serializeJSON(k.value, BufferJSON)),
        },
        transaction,
      },
    );
  }

  for (const part of chunk(deletes)) {
    await sequelize.query(
      `DELETE FROM baileys_auth_keys b
       USING unnest(ARRAY[:types]::text[], ARRAY[:ids]::text[]) AS x(t, i)
       WHERE b.session_id = :sessionId
         AND b.key_type = x.t
         AND b.key_id = x.i`,
      {
        replacements: {
          sessionId: session.id,
          types: part.map((k) => k.type),
          ids: part.map((k) => String(k.id)),
        },
        transaction,
      },
    );
  }
}

// Called only after a NEW login succeeded (first scan or re-link).
// Old rows belong to the previous identity, so they are replaced in one
// transaction: either the new session is fully saved, or nothing changes.
async function persistNewLogin(session) {
  const all = [];
  for (const [type, entries] of session.keys.entries()) {
    for (const [id, value] of entries.entries()) {
      all.push({ type, id, value });
    }
  }

  await sequelize.transaction(async (transaction) => {
    await sequelize.query(
      `DELETE FROM baileys_auth_keys WHERE session_id = :sessionId`,
      { replacements: { sessionId: session.id }, transaction },
    );
    await persistCreds(session, transaction);
    await persistKeyChanges(session, all, [], transaction);
  });

  console.log(`WhatsApp new login saved (${all.length} keys).`);
}

// =====================================================
// DATABASE-BACKED KEY STORE
// Reads come from memory. Writes update memory immediately,
// then persist only the changed keys in the background.
// =====================================================

function createDatabaseKeyStore(session) {
  return {
    get: async (type, ids) => {
      const result = {};
      const typeKeys = session.keys.get(type);

      for (const id of ids) {
        if (typeKeys?.has(id)) {
          result[id] = typeKeys.get(id);
        }
      }

      return result;
    },

    set: async (data) => {
      const upserts = [];
      const deletes = [];

      for (const [type, entries] of Object.entries(data)) {
        if (!session.keys.has(type)) {
          session.keys.set(type, new Map());
        }
        const typeKeys = session.keys.get(type);

        for (const [id, value] of Object.entries(entries)) {
          if (value === null || value === undefined) {
            typeKeys.delete(id);
            deletes.push({ type, id });
          } else {
            typeKeys.set(id, value);
            upserts.push({ type, id, value });
          }
        }
      }

      // Memory is already updated, so a failed DB write must not block sending.
      if (session.persisted && (upserts.length || deletes.length)) {
        enqueue(session, () =>
          persistKeyChanges(session, upserts, deletes),
        ).catch((error) => {
          console.error("Key save error:", error.message);
        });
      }
    },
  };
}

// =====================================================
// QR GENERATION
// =====================================================

async function generateQR(session, qr) {
  console.log("\nScan WhatsApp QR:\n");
  qrcode.generate(qr, { small: true });

  try {
    await QRCode.toFile(QR_PATH, qr, {
      type: "png",
      width: 400,
      margin: 2,
    });
    console.log("QR saved:", QR_PATH);
  } catch (error) {
    console.error("Failed to save QR image:", error);
  }

  session.qr = await QRCode.toDataURL(qr);
  session.status = "qr_pending";
}

function clearQRFile() {
  if (fs.existsSync(QR_PATH)) {
    try {
      fs.unlinkSync(QR_PATH);
    } catch (error) {
      console.error("Failed to delete QR file:", error);
    }
  }
}

// =====================================================
// CREATE SOCKET
// =====================================================

async function createSocket(session) {
  const { default: makeWASocket, DisconnectReason } = session.baileys;

  const sock = makeWASocket({
    auth: session.auth,
    markOnlineOnConnect: false,
    printQRInTerminal: false,
  });

  session.socket = sock;

  // Creds change often but are small: one query.
  sock.ev.on("creds.update", () => {
    if (session.persisted) {
      enqueue(session, () => persistCreds(session)).catch((error) => {
        console.error("Credential save error:", error.message);
      });
    }
  });

  sock.ev.on("connection.update", async (update) => {
    // Ignore events from a socket that has already been replaced.
    if (session.socket && session.socket !== sock) return;

    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      try {
        await generateQR(session, qr);
      } catch (error) {
        console.error("QR generation error:", error);
      }
    }

    if (connection === "connecting") {
      // Do not overwrite a pending QR with "connecting".
      if (session.status !== "qr_pending") {
        session.status = "connecting";
      }
      console.log("WhatsApp connecting...");
    }

    if (connection === "open") {
      session.status = "connected";
      session.qr = null;
      clearQRFile();

      // A new login was just completed: save it (replaces the old identity).
      if (!session.persisted) {
        try {
          await enqueue(session, () => persistNewLogin(session));
          session.persisted = true;
          console.log("First WhatsApp login persisted to database.");
        } catch (error) {
          session.status = "connected_unpersisted";
          console.error("Initial auth persistence failed:", error);
          return;
        }
      }

      console.log("WhatsApp connected successfully!");
    }

    if (connection === "close") {
      session.socket = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log("WhatsApp connection closed:", statusCode);

      // 401: WhatsApp itself ended this linked device (removed on the phone,
      // or invalidated). Nothing is deleted from the database here. We only
      // prepare a fresh in-memory identity so a new QR can be scanned. The
      // stored rows are replaced only after that new login succeeds.
      if (statusCode === DisconnectReason.loggedOut) {
        session.status = "authentication_required";
        session.persisted = false;
        console.log(
          "WhatsApp logged out by the phone/server. Database left untouched. Waiting for a new QR scan.",
        );

        try {
          await session.savePromise;
          session.keys = new Map();
          session.auth.creds = session.baileys.initAuthCreds();
          jidCache.clear();
          await createSocket(session);
        } catch (error) {
          console.error("Logout recovery error:", error);
        }
        return;
      }

      // 440: the same session was opened somewhere else. Reconnecting would
      // make two instances kick each other out forever.
      if (statusCode === DisconnectReason.connectionReplaced) {
        session.status = "replaced";
        console.error(
          "Session replaced by another instance. Not reconnecting. Make sure only one backend uses this session, then restart this service.",
        );
        return;
      }

      session.status = "reconnecting";

      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
      }

      console.log("Reconnecting WhatsApp in 3 seconds...");

      session.reconnectTimer = setTimeout(async () => {
        session.reconnectTimer = null;

        try {
          await session.savePromise;
          await createSocket(session);
        } catch (error) {
          console.error("WhatsApp reconnect error:", error);
        }
      }, 3000);
    }
  });

  return sock;
}

// =====================================================
// START WHATSAPP SESSION
// =====================================================

async function startWhatsAppSession(sessionId = SESSION_ID) {
  let session = sessions.get(sessionId);

  if (session?.socket) {
    return getWhatsAppStatus(sessionId);
  }

  if (session?.starting) {
    await session.starting;
    return getWhatsAppStatus(sessionId);
  }

  if (!session) {
    session = {
      id: sessionId,
      socket: null,
      status: "connecting",
      qr: null,
      reconnectTimer: null,
      startRetryTimer: null,
      savePromise: Promise.resolve(),
      starting: null,
      persisted: false,
      keys: new Map(),
      auth: null,
      baileys: null,
    };
    sessions.set(sessionId, session);
  }

  session.starting = (async () => {
    try {
      session.status = "connecting";

      session.baileys = await import("@whiskeysockets/baileys");

      // Throws if the database cannot be read, so we never fall back to a
      // fresh login because of a temporary database problem.
      const creds = await loadAuthStateWithRetry(session, session.baileys);

      session.auth = {
        creds,
        keys: createDatabaseKeyStore(session),
      };

      await createSocket(session);
    } catch (error) {
      session.status = "error";
      console.error(
        `WhatsApp startup error (no QR will be shown, saved session untouched). Retrying in ${START_RETRY_MS / 1000}s:`,
        error.message,
      );

      if (session.startRetryTimer) clearTimeout(session.startRetryTimer);
      session.startRetryTimer = setTimeout(() => {
        session.startRetryTimer = null;
        startWhatsAppSession(sessionId).catch(() => {});
      }, START_RETRY_MS);
    } finally {
      session.starting = null;
    }
  })();

  await session.starting;

  return getWhatsAppStatus(sessionId);
}

// =====================================================
// GET STATUS
// =====================================================

function getWhatsAppStatus(sessionId = SESSION_ID) {
  const session = sessions.get(sessionId);

  return {
    session_id: sessionId,
    status: session?.status || "disconnected",
    qr: session?.qr || null,
  };
}

// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage(number, message) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

  const session = await getReadySession();
  const t0 = Date.now();

  const { jid, number: formattedNumber } = await resolveJid(
    session.socket,
    number,
  );

  const result = await withTimeout(
    session.socket.sendMessage(jid, { text: message.trim() }),
    SEND_TIMEOUT_MS,
    "sendMessage",
  );

  console.log(
    `WA text sent: ${jid} | id=${result?.key?.id} | ${Date.now() - t0}ms`,
  );

  return {
    success: true,
    number: formattedNumber,
    jid,
    messageId: result?.key?.id,
  };
}

// =====================================================
// SEND DOCUMENT (PDF)
// =====================================================

async function sendDocument(number, file, options = {}) {
  if (!file) {
    throw new Error("Document file is required");
  }

  const session = await getReadySession();
  const t0 = Date.now();

  const { jid, number: formattedNumber } = await resolveJid(
    session.socket,
    number,
  );

  // Normalise file to Buffer
  const buffer = Buffer.isBuffer(file) ? file : fs.readFileSync(file);

  if (!buffer.length) {
    throw new Error("Document file is empty");
  }

  // Safe file name, always ends in .pdf
  let fileName = String(options.fileName || "Estimation.pdf")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
  if (!/\.pdf$/i.test(fileName)) fileName += ".pdf";

  const mimetype = options.mimetype || "application/pdf";
  const caption = options.caption || "";

  const result = await withTimeout(
    session.socket.sendMessage(jid, {
      document: buffer,
      mimetype,
      fileName,
      caption,
    }),
    SEND_TIMEOUT_MS,
    "sendMessage",
  );

  console.log(
    `WA document sent: ${jid} | ${fileName} | ${buffer.length} bytes | id=${result?.key?.id} | ${Date.now() - t0}ms`,
  );

  return {
    success: true,
    number: formattedNumber,
    jid,
    messageId: result?.key?.id,
  };
}

// =====================================================
// EXPORT
// =====================================================

const VALID_TEMPLATE_TYPES = [
  "simple",
  "good",
  "warm",
  "promo",
  "visit",
  "payment",
];

// READ ALL
async function fetchFollowUpTemplates() {
  try {
    const data = await sequelize.query(
      `SELECT id, name, type, message, created_at, updated_at
       FROM follow_up_templates
       ORDER BY created_at DESC`,
      { type: sequelize.QueryTypes.SELECT },
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
}

// READ ONE
async function fetchFollowUpTemplateById(id) {
  try {
    if (!id) throw new Error("Template id is required");

    const rows = await sequelize.query(
      `SELECT id, name, type, message, created_at, updated_at
       FROM follow_up_templates
       WHERE id = :id
       LIMIT 1`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return {
      success: true,
      data: rows[0] || null,
    };
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
}

// CREATE
async function createFollowUpTemplate({ name, type, message }) {
  try {
    const cleanName = String(name || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!cleanName) throw new Error("Template name is required");
    if (!cleanMessage) throw new Error("Template message is required");
    if (!VALID_TEMPLATE_TYPES.includes(type)) {
      throw new Error(`Invalid template type: ${type}`);
    }

    const [data] = await sequelize.query(
      `INSERT INTO follow_up_templates (name, type, message)
       VALUES (:name, :type, :message)
       RETURNING id, name, type, message, created_at, updated_at`,
      {
        replacements: {
          name: cleanName,
          type,
          message: cleanMessage,
        },
      },
    );

    return {
      success: true,
      data: data[0],
      message: "Template created successfully",
    };
  } catch (error) {
    console.error("Error creating template:", error);
    throw error;
  }
}

// UPDATE
async function updateFollowUpTemplate({ id, name, type, message }) {
  try {
    if (!id) throw new Error("Template id is required");

    const cleanName = String(name || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!cleanName) throw new Error("Template name is required");
    if (!cleanMessage) throw new Error("Template message is required");
    if (!VALID_TEMPLATE_TYPES.includes(type)) {
      throw new Error(`Invalid template type: ${type}`);
    }

    const [data] = await sequelize.query(
      `UPDATE follow_up_templates
       SET name = :name,
           type = :type,
           message = :message,
           updated_at = NOW()
       WHERE id = :id
       RETURNING id, name, type, message, created_at, updated_at`,
      {
        replacements: {
          id,
          name: cleanName,
          type,
          message: cleanMessage,
        },
      },
    );

    if (!data.length) throw new Error("Template not found");

    return {
      success: true,
      data: data[0],
      message: "Template updated successfully",
    };
  } catch (error) {
    console.error("Error updating template:", error);
    throw error;
  }
}

// DELETE
async function deleteFollowUpTemplate(id) {
  try {
    if (!id) throw new Error("Template id is required");

    const [data] = await sequelize.query(
      `DELETE FROM follow_up_templates
       WHERE id = :id
       RETURNING id`,
      {
        replacements: { id },
      },
    );

    if (!data.length) throw new Error("Template not found");

    return {
      success: true,
      data: data[0],
      message: "Template deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
}

module.exports = {
  startWhatsAppSession,
  getWhatsAppStatus,
  sendMessage,
  sendDocument,

  fetchFollowUpTemplates,
  fetchFollowUpTemplateById,
  createFollowUpTemplate,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
};
