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
router.post("/getFileGeneration", registrationController.getFileGeneration);
router.get(
  "/fetchCustomersByStatus",
  registrationController.fetchCustomersByStatus,
);
router.get(
  "/getInventoryByCategory",
  registrationController.getInventoryByCategory,
);
router.get(
  "/getInventoryByCategoryThree",
  registrationController.getInventoryByCategoryThree,
);
module.exports = router;
