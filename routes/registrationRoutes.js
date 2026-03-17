const registrationController = require("../controllers/registrationController");
const express = require("express");

const router = express.Router();
router.get("/getCustomersWithSummary",registrationController.getCustomersWithSummary);
module.exports = router;
