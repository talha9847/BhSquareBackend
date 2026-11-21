const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const { startWhatsAppSession } = require("./services/whatsappService");
const sequelize = require("./config/db");
const UserSeeder = require("./Seeder/UserSeed");
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");
const sourceRoutes = require("./routes/sourceRoute");
const customerRoutes = require("./routes/customerRoutes");
const docCollectRoutes = require("./routes/docCollectRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const nameChangeRoutes = require("./routes/nameChangeRoute");
const kitReadyRoutes = require("./routes/kitReadyRoutes");
const loanRoutes = require("./routes/loanRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const wiringhRoutes = require("./routes/wiringRoutes");
const estimationRoutes = require("./routes/estimationRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const whatsappFollowupRoutes = require("./routes/whatsappFollowupRoutes");

// ── NEW: WhatsApp follow-up worker ──
const {
  startWhatsappFollowupWorker,
  stopWhatsappFollowupWorker,
} = require("./workers/whatsappFollowupWorker");

require("./models/associationModel");

UserSeeder.startServer();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://bhsquare.in",
      "https://www.bhsquare.in",
      "https://bh-square-frontend.vercel.app",
      "https://bhsquarefrontendh.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`➡️ ${req.method} ${req.url}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `⬅️ ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/sources", sourceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/docs", docCollectRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/namechange", nameChangeRoutes);
app.use("/api/kitready", kitReadyRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/wiring", wiringhRoutes);
app.use("/api/estimation", estimationRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/whatsapp-followups", whatsappFollowupRoutes);

// NOTE: no app.listen() here — bootstrap() handles it

async function bootstrap() {
  try {
    // Start WhatsApp (restores from DB if creds exist, else shows QR)
    // const status = await startWhatsAppSession();
    const [result] = await sequelize.query(`
        SELECT
            current_database() AS database,
            current_user AS username,
            current_setting('search_path') AS search_path,
            current_schemas(true) AS schemas,
            current_schema() AS schema
    `);

    console.log("NODE CONNECTION CHECK:", result);
    // console.log("WhatsApp initial status:", status);

    const server = app.listen(3000, () => {
      console.log(`Server listening on http://localhost:3000`);

      // ── NEW: start the follow-up worker ──
      startWhatsappFollowupWorker();
      console.log("WhatsApp follow-up worker started");

      setInterval(
        async () => {
          try {
            const response = await fetch(`${process.env.RENDER_URL}/`);
            console.log(
              `🏓 Render ping: ${response.status} - ${new Date().toISOString()}`,
            );
          } catch (error) {
            console.error("❌ Render ping failed:", error.message);
          }
        },
        13 * 60 * 1000, // every 13 minutes
      );
    });

    // ── NEW: graceful shutdown ──
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down...`);
      try {
        await stopWhatsappFollowupWorker();
        server.close(() => console.log("HTTP server closed"));
        await sequelize.close();
        process.exit(0);
      } catch (err) {
        console.error("Shutdown error:", err);
        process.exit(1);
      }
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start WhatsApp session:", error);
    process.exit(1);
  }
}

bootstrap();
