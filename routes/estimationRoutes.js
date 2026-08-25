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

module.exports = router;
