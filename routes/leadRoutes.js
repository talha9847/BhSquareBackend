const leadController = require("../controllers/leadController");
const express = require("express");
const middleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post(
  "/addLead",
  middleware.authMiddleware(["admin"]),
  leadController.addLead,
);
router.get(
  "/fetchPendingLeads",
  middleware.authMiddleware(["admin"]),
  leadController.fetchPendingLeads,
);
router.get(
  "/fetchLeadsByStatus",
  middleware.authMiddleware(["admin"]),
  leadController.fetchLeadsByStatus,
);
router.get(
  "/fetchLeadsBySource",
  middleware.authMiddleware(["source"]),
  leadController.fetchLeadsBySource,
);
router.get(
  "/fetchPendingLeadsCount",
  middleware.authMiddleware(["admin"]),
  leadController.fetchPendingLeadsCount,
);
router.post(
  "/delayLead",
  middleware.authMiddleware(["admin"]),
  leadController.delayLead,
);
router.post(
  "/delayToPending",
  middleware.authMiddleware(["admin"]),
  leadController.delayToPending,
);
router.post(
  "/convertToCustomer",
  middleware.authMiddleware(["admin"]),
  leadController.convertToCustomer,
);
router.post(
  "/cancelLead",
  middleware.authMiddleware(["admin"]),
  leadController.cancelLead,
);
router.post(
  "/updateLead",
  middleware.authMiddleware(["admin"]),
  leadController.updateLead,
);
router.get(
  "/fetchLeadById/:id",
  middleware.authMiddleware(["admin","source"]),
  leadController.fetchLeadById,
);

module.exports = router;
