const userService = require("../services/userService");
const jwtService = require("../services/jwtService");

async function login(req, res) {
  console.log("I am hitet");
  const { email, pass } = req.body;

  const isCorrect = await userService.login(email, pass);

  if (isCorrect.code == 0 || isCorrect.code == -1)
    return res.json({ message: "Invalid Credential", success: false });

  if (isCorrect.code == -2)
    return res.json({ message: "Internal server error", success: false });
  console.log(isCorrect.role);
  if (isCorrect.code == 1) {
    const token = await jwtService.signJwt(
      isCorrect.user.id,
      isCorrect.user.email,
      isCorrect.role,
      isCorrect.role_id,
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      success: true,
      message: "User logged in successfully",
      token: token,
      data: isCorrect,
    });
  }
}

async function me(req, res) {
  try {
    res.status(200).json({ email: req.user.email, role: req.user.role });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function createUser(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "email, password and role are required",
      });
    }

    const result = await userService.createUser(email, password, role);

    return res.status(201).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error(" Controller Error:", error);

    if (error.message.includes("exists") || error.message.includes("Invalid")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function getAllUsers(req, res) {
  try {
    // 🔹 Call service
    const result = await userService.getAllUsers();

    return res.status(200).json({
      message: "Users fetched successfully",
      count: result.count,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    const { id, password, confirmPassword, role, role_id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "User id is required",
      });
    }

    if (password) {
      if (!confirmPassword) {
        return res.status(400).json({
          message: "confirmPassword is required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Password and confirmPassword do not match",
        });
      }
    }

    const user = await userService.updateUser({
      id,
      password,
      role,
      role_id,
    });

    return res.status(200).json({
      message: "User updated successfully",
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.error(" Controller Error:", error);

    if (error.message.includes("not found")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message.includes("admin")) {
      return res.status(403).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = { login, createUser, getAllUsers, me, updateUser };
