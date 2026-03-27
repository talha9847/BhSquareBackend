const dispatchController = require("../controllers/dispatchController");

const express = require("express");
const router = express.Router();

router.get("/fetchDispatches", dispatchController.fetchDispatches);
router.post("/updateDispatch", dispatchController.updateDispatch);
router.post("/createFabricator", dispatchController.createFabricator);
router.get("/fetchFabricators", dispatchController.fetchFabricators);
router.put("/updateFabricator/:id", dispatchController.updateFabricator);
router.get("/fetchFabrications", dispatchController.fetchFabrications);
router.put("/updateFabrication/", dispatchController.updateFabrication);
router.put("/updateFabricatorViaId/", dispatchController.updateFabricatorViaId);

module.exports = router;
