const customerController = require("../controllers/customerController");

const express = require("express");
const router = express.Router();

router.get("/getCustomers", customerController.getCustomers);

module.exports = router;
