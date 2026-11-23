require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("1. Open this URL in your browser:\n", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "\n2. Paste the 'code' query parameter from the redirect URL here: ",
  async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(
        decodeURIComponent(code.trim()),
      );
      console.log("\n✅ New Refresh Token:\n", tokens.refresh_token);
    } catch (err) {
      console.error(
        "\n❌ Failed to exchange code:",
        err.response?.data || err.message,
      );
    } finally {
      rl.close();
    }
  },
);
