const sourceController = require("../controllers/sourceController");
const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");

router.get(
  "/fetchSources",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchSources,
);
router.get(
  "/fetchSupervisor",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchSupervisor,
);

router.get(
  "/fetchAllSources",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchAllSources,
);
router.get(
  "/fetchAllSupervisor",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchAllSupervisor,
);

router.put(
  "/updateSource/:id",
  middleware.authMiddleware(["admin"]),
  sourceController.updateSource,
);

router.put(
  "/updateSupervisor/:id",
  middleware.authMiddleware(["admin"]),
  sourceController.updateSupervisor,
);

router.post(
  "/addSource",
  middleware.authMiddleware(["admin"]),
  sourceController.addSource,
);
router.post(
  "/addSupervisor",
  middleware.authMiddleware(["admin"]),
  sourceController.addSupervisor,
);

router.put(
  "/updateSupervisorViaId",
  middleware.authMiddleware(["admin"]),
  sourceController.updateSupervisorViaId,
);
router.get(
  "/getFinalStageCustomers",
  middleware.authMiddleware(["admin"]),
  sourceController.getFinalStageCustomers,
);
router.post(
  "/updateStage10",
  middleware.authMiddleware(["admin"]),
  sourceController.updateStage10,
);
router.post(
  "/updateStage11",
  middleware.authMiddleware(["admin"]),
  sourceController.updateStage11,
);
router.post(
  "/updateStage12",
  middleware.authMiddleware(["admin"]),
  sourceController.updateStage12,
);
router.post(
  "/updateStage13",
  middleware.authMiddleware(["admin"]),
  sourceController.updateStage13,
);
router.post(
  "/updateStage14",
  middleware.authMiddleware(["admin"]),
  sourceController.updateStage14,
);
router.get(
  "/getAllMasters",
  middleware.authMiddleware(["admin"]),
  sourceController.getAllMasters,
);
router.get(
  "/getCustomersBySource",
  middleware.authMiddleware(["source"]),
  sourceController.getCustomersBySource,
);
router.get(
  "/getPermissions/:customerId/:leadId",
  middleware.authMiddleware(["admin"]),
  sourceController.getPermissions,
);
router.get(
  "/fetchAllWebLeads",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchAllWebLeads,
);
router.put(
  "/updatePermission/:permissionId",
  middleware.authMiddleware(["admin"]),
  sourceController.updatePermission,
);
router.put(
  "/updateWebLead",
  middleware.authMiddleware(["admin"]),
  sourceController.updateWebLead,
);

router.get(
  "/checkPermission/:customerId/:pageId",
  middleware.authMiddleware(["source"]),
  sourceController.checkPermission,
);
router.get(
  "/getPaidCommissionBySourceId",
  middleware.authMiddleware(["source"]),
  sourceController.getPaidCommissionBySourceId,
);
router.get(
  "/getCompletionReport",
  middleware.authMiddleware(["admin"]),
  sourceController.getCompletionReport,
);
router.put(
  "/updateExtraCost",
  middleware.authMiddleware(["admin"]),
  sourceController.updateExtraCost,
);
router.post("/addWebLead", sourceController.addWebLead);
module.exports = router;
