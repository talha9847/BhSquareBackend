const jwt = require("jsonwebtoken");
require("dotenv").config();

async function signJwt(id, email, role) {
  try {
    const payload = { id, email, role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d",
      issuer: "my-app",
    });

    return token;
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { signJwt };
