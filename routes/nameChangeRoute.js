const nameChangeController = require("../controllers/nameChangeController");
const express = require("express");

const router = express.Router();
const upload = require("../middlewares/upload");

router.post(
  "/uploadNameChangeFiles",
  upload.any(),
  nameChangeController.uploadNameChangeFiles,
);
router.post("/checkReady", nameChangeController.checkReady);
router.post("/goToStageThree", nameChangeController.goToStageThree);

module.exports = router;
