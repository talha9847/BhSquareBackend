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
const JID_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DB_CHUNK_SIZE = 500;

// number -> { jid, number, expires }
const jidCache = new Map();

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

function getReadySession() {
  const session = sessions.get(SESSION_ID);

  if (!session || !session.socket) {
    throw new Error("WhatsApp session not initialized");
  }
  if (session.status !== "connected") {
    throw new Error(`WhatsApp is not connected (status: ${session.status})`);
  }
  return session;
}

// =====================================================
// LOAD AUTH STATE FROM DATABASE
// =====================================================

async function loadAuthState(session, baileys) {
  const { BufferJSON, initAuthCreds } = baileys;

  try {
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

    if (hasCreds) {
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

      for (const row of keyRows) {
        if (!session.keys.has(row.key_type)) {
          session.keys.set(row.key_type, new Map());
        }
        session.keys
          .get(row.key_type)
          .set(row.key_id, restoreJSON(row.key_data, BufferJSON));
      }

      console.log(`Restored ${keyRows.length} auth key(s) from database.`);

      session.persisted = true;
      return creds;
    }
  } catch (error) {
    console.error("Error loading auth state from database:", error);
  }

  console.log("No saved session found. Initializing fresh authentication...");
  session.persisted = false;
  return initAuthCreds();
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
async function persistCreds(session) {
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
    },
  );
}

// Changed keys only: 1 query per DB_CHUNK_SIZE keys.
async function persistKeyChanges(session, upserts, deletes) {
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
      },
    );
  }
}

// Full dump: only for the first login of a fresh session.
async function persistAllKeys(session) {
  const all = [];
  for (const [type, entries] of session.keys.entries()) {
    for (const [id, value] of entries.entries()) {
      all.push({ type, id, value });
    }
  }

  await persistCreds(session);
  await persistKeyChanges(session, all, []);
  console.log(`WhatsApp full auth saved (${all.length} keys).`);
}

// Remove everything stored for this session (used after logout).
async function clearStoredAuth(session) {
  await sequelize.query(
    `DELETE FROM baileys_auth_keys WHERE session_id = :sessionId`,
    { replacements: { sessionId: session.id } },
  );
  await sequelize.query(
    `DELETE FROM baileys_sessions WHERE session_id = :sessionId`,
    { replacements: { sessionId: session.id } },
  );
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
      session.status = "connecting";
      console.log("WhatsApp connecting...");
    }

    if (connection === "open") {
      session.status = "connected";
      session.qr = null;
      clearQRFile();

      // First successful login: save everything once.
      if (!session.persisted) {
        try {
          session.persisted = true;
          await enqueue(session, () => persistAllKeys(session));
          console.log("First WhatsApp login persisted to database.");
        } catch (error) {
          session.persisted = false;
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

      // 401: logged out from the phone. Wipe auth and start fresh for a new QR.
      if (statusCode === DisconnectReason.loggedOut) {
        session.status = "authentication_required";
        session.persisted = false;
        console.log(
          "WhatsApp logged out. Clearing auth and requesting a new QR.",
        );

        try {
          await session.savePromise;
          await clearStoredAuth(session);
          session.keys = new Map();
          session.auth.creds = session.baileys.initAuthCreds();
          jidCache.clear();
          await createSocket(session);
        } catch (error) {
          console.error("Logout cleanup error:", error);
        }
        return;
      }

      // 440: the same session was opened somewhere else. Reconnecting would
      // make two instances kick each other out forever.
      if (statusCode === DisconnectReason.connectionReplaced) {
        session.status = "replaced";
        console.error(
          "Session replaced by another instance. Not reconnecting. Restart this service to take the session back.",
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

      session.auth = {
        creds: await loadAuthState(session, session.baileys),
        keys: createDatabaseKeyStore(session),
      };

      await createSocket(session);
    } catch (error) {
      session.status = "error";
      console.error("WhatsApp startup error:", error);
      throw error;
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
  const session = getReadySession();

  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

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
  const session = getReadySession();

  if (!file) {
    throw new Error("Document file is required");
  }

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

module.exports = {
  startWhatsAppSession,
  getWhatsAppStatus,
  sendMessage,
  sendDocument,
};
