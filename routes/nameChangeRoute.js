const nameChangeController = require("../controllers/nameChangeController");
const express = require("express");
const middleware = require("../middlewares/authMiddleware");
const router = express.Router();
const upload = require("../middlewares/upload");

router.post(
  "/uploadNameChangeFiles",
  upload.any(),
  middleware.authMiddleware(["admin", "source"]),
  nameChangeController.uploadNameChangeFiles,
);
router.post(
  "/checkReady",
  middleware.authMiddleware(["admin"]),
  nameChangeController.checkReady,
);
router.post(
  "/goToStageThree",
  middleware.authMiddleware(["admin"]),
  nameChangeController.goToStageThree,
);

module.exports = router;
