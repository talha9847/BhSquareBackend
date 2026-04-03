const sequelize = require("../config/db");
const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");
const { signJwt } = require("./jwtService");
async function login(email, pass) {
  try {
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) return { code: 0 };

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) return { code: -1 };
    const token = signJwt(user.id, user.email, user.role);

    return {
      code: 1,
      token,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    console.log(error);
    return { code: -2 };
  }
}

async function createUser(email, password, role) {
  try {
    if (!email || !password || !role) {
      throw new Error("email, password and role are required");
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    return {
      success: true,
      message: "User created successfully",
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password"], // 🔥 important
      },
      order: [["id", "DESC"]],
    });

    return {
      success: true,
      count: users.length,
      data: users,
    };
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    throw error;
  }
}
module.exports = { login, createUser, getAllUsers };
