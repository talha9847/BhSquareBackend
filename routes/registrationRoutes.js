const registrationController = require("../controllers/registrationController");
const express = require("express");

const router = express.Router();
router.get(
  "/getCustomersWithSummary",
  registrationController.getCustomersWithSummary,
);
router.post("/registration", registrationController.registration);
router.post(
  "/markRegistrationAsDone",
  registrationController.markRegistrationAsDone,
);
module.exports = router;
