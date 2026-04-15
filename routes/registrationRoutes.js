const registrationController = require("../controllers/registrationController");
const express = require("express");
const middleware = require("../middlewares/authMiddleware");

const router = express.Router();
router.get(
  "/getCustomersWithSummary",
  middleware.authMiddleware(["admin"]),
  registrationController.getCustomersWithSummary,
);
router.post(
  "/registration",
  middleware.authMiddleware(["admin"]),
  registrationController.registration,
);
router.post(
  "/markRegistrationAsDone",
  middleware.authMiddleware(["admin"]),
  registrationController.markRegistrationAsDone,
);
router.post(
  "/completeRegistration",
  middleware.authMiddleware(["admin"]),
  registrationController.completeRegistration,
);
router.post(
  "/getFileGeneration",
  middleware.authMiddleware(["admin"]),
  registrationController.getFileGeneration,
);
router.get(
  "/fetchCustomersByStatus",
  middleware.authMiddleware(["admin"]),
  registrationController.fetchCustomersByStatus,
);
router.get(
  "/getInventoryByCategory",
  middleware.authMiddleware(["admin"]),
  registrationController.getInventoryByCategory,
);
router.get(
  "/getInventoryByCategoryThree",
  middleware.authMiddleware(["admin"]),
  registrationController.getInventoryByCategoryThree,
);
router.get(
  "/getFileGenerationBasicDetails/:registrationId",
  middleware.authMiddleware(["admin"]),
  registrationController.getFileGenerationBasicDetails,
);
router.put(
  "/updateFileGenerationAndLead/:registrationId/:leadId",
  middleware.authMiddleware(["admin"]),
  registrationController.updateFileGenerationAndLead,
);

module.exports = router;
