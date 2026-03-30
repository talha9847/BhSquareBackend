const customerController = require("../controllers/customerController");

const express = require("express");
const router = express.Router();

router.get("/getCustomers", customerController.getCustomers);
router.post(
  "/updateCustomerNameChange",
  customerController.updateCustomerNameChange,
);
router.get("/fetchCustomerStages/:id", customerController.fetchCustomerStages);

module.exports = router;
