const jwt = require("jsonwebtoken");
require("dotenv").config();

async function signJwt(email, role) {
  try {
    const payload = { email, role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });


    return token;
  } catch (error) {
    console.log(error);

    return null;
  }
}

module.exports = { signJwt };
