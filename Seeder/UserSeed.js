const sequelize = require("../config/db");
const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");

async function seedAdmin(req, res) {
  try {
    const adminEmail = "admin@gmail.com";

    const existAdmin = await User.findOne({
      where: { email: adminEmail },
    });

    if (!existAdmin) {
      const hashedPass = await bcrypt.hash("Admin@123", 10);
      await User.create({
        email: adminEmail,
        password: hashedPass,
        role: "admin",
      });

      console.log("Admin is create");
    } else {
      console.log("Admin already exist");
    }
  } catch (error) {
    console.log("Errorr:::  ", error);
  }
}

async function startServer() {
  sequelize.authenticate();
  console.log("Conneeecdtteeedddd  ");

  seedAdmin();
}

module.exports = { startServer };
