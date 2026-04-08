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
  "/fetchAllSources",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchAllSources,
);

router.put(
  "/updateSource/:id",
  middleware.authMiddleware(["admin"]),
  sourceController.updateSource,
);
router.post(
  "/addSource",
  middleware.authMiddleware(["admin"]),
  sourceController.addSource,
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
router.put(
  "/updatePermission/:permissionId",
  middleware.authMiddleware(["admin"]),
  sourceController.updatePermission,
);

router.get(
  "/checkPermission/:customerId/:pageId",
  middleware.authMiddleware(["source"]),
  sourceController.checkPermission,
);
module.exports = router;
