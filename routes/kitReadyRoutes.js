const kitReadyController = require("../controllers/kitReadyController");
const express = require("express");
const router = express.Router();

router.get(
  "/fetchKitReadyCustomers",
  kitReadyController.fetchKitReadyCustomers,
);
router.post("/updateLoan", kitReadyController.updateLoan);

module.exports = router;
