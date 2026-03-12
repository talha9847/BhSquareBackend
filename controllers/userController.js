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

  if (isCorrect.code == 1) {
    const token = await jwtService.signJwt(email, isCorrect.role);

    return res.json({
      success: true,
      message: "User logged in successfully",
      token: token,
    });
  }
}

module.exports = { login };
