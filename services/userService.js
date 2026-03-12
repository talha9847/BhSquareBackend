const sequelize = require("../config/db");
const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");

async function login(email, pass) {
  try {
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) return { code: 0 };

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) return { code: -1 };

    return { code: 1, role: user.role };
  } catch (error) {
    console.log(error);
    return { code: -2 };
  }
}

module.exports = { login };
