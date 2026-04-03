const sourceController = require("../controllers/sourceController");
const express = require("express");
const router = express.Router();

router.get("/fetchSources", sourceController.fetchSources);
router.post("/addSource", sourceController.addSource);
router.get("/getFinalStageCustomers", sourceController.getFinalStageCustomers);
router.post("/updateStage10", sourceController.updateStage10);
router.post("/updateStage11", sourceController.updateStage11);
router.post("/updateStage12", sourceController.updateStage12);
router.post("/updateStage13", sourceController.updateStage13);

module.exports = router;
