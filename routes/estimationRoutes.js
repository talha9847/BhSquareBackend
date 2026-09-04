const kitReadyController = require("../controllers/kitReadyController");
const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
const estimationController = require("../controllers/estimationController");

router.get(
  "/getEstimations",
  middleware.authMiddleware(["admin"]),
  estimationController.getEstimations,
);
router.get(
  "/getEstimationTypes",
  middleware.authMiddleware(["admin"]),
  estimationController.getEstimationTypes,
);
router.post(
  "/addEstimation",
  middleware.authMiddleware(["admin"]),
  estimationController.addEstimation,
);
router.put(
  "/updateEstimation/:id",
  middleware.authMiddleware(["admin"]),
  estimationController.updateEstimation,
);
router.put(
  "/updateInverter/:id",
  middleware.authMiddleware(["admin"]),
  estimationController.updateInverter,
);

router.post(
  "/generateEstimation",
  middleware.authMiddleware(["admin"]),
  estimationController.generateEstimation,
);

router.get(
  "/getInverters",
  middleware.authMiddleware(["admin"]),
  estimationController.getInverters,
);
router.post(
  "/addInverter",
  middleware.authMiddleware(["admin"]),
  estimationController.addInverter,
);

router.delete(
  "/deleteEstimation/:id",
  middleware.authMiddleware(["admin"]),
  estimationController.deleteEstimation,
);

router.post(
  "/createAgency",
  middleware.authMiddleware(["admin"]),
  estimationController.createAgency,
);

router.put(
  "/updateAgency/:id",
  middleware.authMiddleware(["admin"]),
  estimationController.updateAgency,
);

router.delete(
  "/deleteAgency/:id",
  middleware.authMiddleware(["admin"]),
  estimationController.deleteAgency,
);

router.get(
  "/getAllAgencies",
  middleware.authMiddleware(["admin"]),
  estimationController.getAllAgencies,
);

router.post(
  "/createAgencyInventory",
  middleware.authMiddleware(["admin"]),
  estimationController.createAgencyInventory,
);

router.get(
  "/getAllAgencyInventory",
  middleware.authMiddleware(["admin"]),
  estimationController.getAllAgencyInventory,
);

module.exports = router;
