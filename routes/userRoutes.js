const userController = require("../controllers/userController");
const express = require("express");
const middleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/login", userController.login);
router.post(
  "/createUser",
  middleware.authMiddleware(["admin"]),
  userController.createUser,
);
router.get(
  "/getAllUsers",
  middleware.authMiddleware(["admin"]),
  userController.getAllUsers,
);
router.get(
  "/me",
  middleware.authMiddleware(["admin"]),
  userController.me,
);

module.exports = router;
