const customerController = require("../controllers/customerController");
const middleware = require("../middlewares/authMiddleware");
const express = require("express");
const router = express.Router();

router.get(
  "/getCustomers",
  middleware.authMiddleware(["admin"]),
  customerController.getCustomers,
);
router.post(
  "/updateCustomerNameChange",
  middleware.authMiddleware(["admin"]),
  customerController.updateCustomerNameChange,
);
router.get(
  "/fetchCustomerStages/:id",
  middleware.authMiddleware(["admin"]),
  customerController.fetchCustomerStages,
);
router.get(
  "/fetchCustomersByStatus",
  middleware.authMiddleware(["admin"]),
  customerController.fetchCustomersByStatus,
);

module.exports = router;
