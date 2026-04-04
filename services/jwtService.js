const jwt = require("jsonwebtoken");
require("dotenv").config();

async function signJwt(id, email, role, role_id) {
  try {
    const payload = { id, email, role, role_id };
    console.log("PayLoad:   ", payload);
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
