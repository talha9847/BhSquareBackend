const sequelize = require("../config/db");
const { User } = require("../models/userModel");
const bcrypt = require("bcrypt");
async function login(email, pass) {
  try {
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) return { code: 0 }; // user not found

    // 🔴 check active status
    if (!user.is_active) {
      return { code: -1, message: "User is inactive. Contact admin." };
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return { code: -1 }; // wrong password

    return {
      code: 1,
      role: user.role,
      role_id: user.role_id,
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

async function createUser(email, password, role, role_id) {
  try {
    if (!email || !password || !role || !role_id) {
      throw new Error("email, password and role are required");
    }
    email = email.toLowerCase();

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      role_id,
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

async function updateUser({ id, password, role, role_id }) {
  if (!id) {
    throw new Error("User id is required");
  }

  const user = await User.findByPk(id);

  if (!user) {
    throw new Error("User not found");
  }

  const updateData = {};

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (user.role === "admin") {
    updateData.role_id = 0; // force
  } else {
    if (role) {
      updateData.role = role;
    }

    if (role_id !== undefined) {
      updateData.role_id = role_id;
    }
  }

  updateData.updated_at = new Date();

  await user.update(updateData);

  return user;
}

async function updateUserActiveStatus(userId, isActive) {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (typeof isActive !== "boolean") {
      throw new Error("isActive must be boolean");
    }

    // 🔹 fetch user
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      return {
        success: false,
        message: "Admin user cannot be deactivated",
      };
    }

    // 🔹 update status
    await user.update({
      is_active: isActive,
      updated_at: new Date(),
    });

    return {
      success: true,
      data: {
        id: user.id,
        is_active: user.is_active,
      },
      message: "User status updated successfully",
    };
  } catch (error) {
    throw error;
  }
}
module.exports = {
  login,
  createUser,
  getAllUsers,
  updateUser,
  updateUserActiveStatus,
};
