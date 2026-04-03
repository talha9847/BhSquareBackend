const sourceController = require("../controllers/sourceController");
const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");

router.get(
  "/fetchSources",
  middleware.authMiddleware(["admin"]),
  sourceController.fetchSources,
);
router.post(
  "/addSource",
  middleware.authMiddleware(["admin"]),
  sourceController.addSource,
);
router.get("/getFinalStageCustomers", sourceController.getFinalStageCustomers);
router.post("/updateStage10", sourceController.updateStage10);
router.post("/updateStage11", sourceController.updateStage11);
router.post("/updateStage12", sourceController.updateStage12);
router.post("/updateStage13", sourceController.updateStage13);

module.exports = router;
