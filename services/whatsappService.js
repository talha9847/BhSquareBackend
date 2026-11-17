const sequelize = require("../config/db");
const QRCode = require("qrcode");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");

const sessions = new Map();

const QR_PATH = path.join(process.cwd(), "qr.png");
const SESSION_ID = process.env.BAILEYS_SESSION_ID || "rayvolts-dev";
const DEFAULT_COUNTRY_CODE = process.env.WA_DEFAULT_COUNTRY_CODE || "91";

// =====================================================
// JSON HELPERS
// =====================================================

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
// Without this, Baileys reports "sent" even when the number is wrong.
async function resolveJid(sock, number) {
  const n = normalizeNumber(number);

  if (n.length < 11 || n.length > 15) {
    throw new Error(`Invalid phone number: ${n || "(empty)"}`);
  }

  const results = await sock.onWhatsApp(n);
  const found = results?.[0];

  if (!found?.exists) {
    throw new Error(`${n} is not registered on WhatsApp`);
  }

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
// DATABASE-BACKED KEY STORE
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
      for (const [type, entries] of Object.entries(data)) {
        if (!session.keys.has(type)) {
          session.keys.set(type, new Map());
        }

        const typeKeys = session.keys.get(type);

        for (const [id, value] of Object.entries(entries)) {
          if (value === null) {
            typeKeys.delete(id);
          } else {
            typeKeys.set(id, value);
          }
        }
      }

      // Persist only after the session has been fully registered.
      if (session.persisted) {
        await queueAuthSave(session);
      }
    },
  };
}

// =====================================================
// PERSIST AUTH STATE TO DATABASE
// =====================================================

async function persistAuthState(session) {
  const { BufferJSON } = session.baileys;

  await sequelize.transaction(async (transaction) => {
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

    for (const [type, entries] of session.keys.entries()) {
      for (const [id, value] of entries.entries()) {
        await sequelize.query(
          `INSERT INTO baileys_auth_keys
             (session_id, key_type, key_id, key_data)
           VALUES
             (:sessionId, :type, :id, CAST(:keyData AS JSONB))
           ON CONFLICT (session_id, key_type, key_id)
           DO UPDATE SET
             key_data = EXCLUDED.key_data,
             updated_at = CURRENT_TIMESTAMP`,
          {
            replacements: {
              sessionId: session.id,
              type,
              id,
              keyData: serializeJSON(value, BufferJSON),
            },
            transaction,
          },
        );
      }
    }
  });

  console.log("WhatsApp authentication saved to PostgreSQL.");
}

// =====================================================
// SERIALIZE AUTH SAVES
// =====================================================

function queueAuthSave(session) {
  session.savePromise = (session.savePromise || Promise.resolve())
    .catch(() => {}) // never break the chain on prior failure
    .then(() => persistAuthState(session));

  return session.savePromise;
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

// =====================================================
// CLEANUP
// =====================================================

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

  // Save credentials only after the session is registered.
  sock.ev.on("creds.update", () => {
    if (session.persisted) {
      queueAuthSave(session).catch((error) => {
        console.error("Credential save error:", error);
      });
    }
  });

  // =================================================
  // CONNECTION EVENTS
  // =================================================

  sock.ev.on("connection.update", async (update) => {
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

      // Persist on first successful login.
      if (!session.persisted) {
        try {
          session.persisted = true;
          await queueAuthSave(session);
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

      if (statusCode === DisconnectReason.loggedOut) {
        session.status = "authentication_required";
        session.persisted = false;
        console.log("WhatsApp authentication needs a new QR.");
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

  const { jid, number: formattedNumber } = await resolveJid(
    session.socket,
    number,
  );

  const result = await session.socket.sendMessage(jid, {
    text: message.trim(),
  });

  console.log("WA text sent:", jid, result?.key?.id);

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

  const result = await session.socket.sendMessage(jid, {
    document: buffer,
    mimetype,
    fileName,
    caption,
  });

  console.log(
    `WA document sent: ${jid} | ${fileName} | ${buffer.length} bytes | id=${result?.key?.id}`,
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
