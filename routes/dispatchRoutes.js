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
router.post("/createDriver", dispatchController.createDriver);
router.post("/createCar", dispatchController.createCar);
router.get("/fetchDrivers", dispatchController.fetchDrivers);
router.get("/fetchCars", dispatchController.fetchCars);
router.put("/updateDriver/:id", dispatchController.updateDriver);
router.put("/updateCar/:id", dispatchController.updateCar);
router.get(
  "/fetchDispatchesByStatus",
  dispatchController.fetchDispatchesByStatus,
);

module.exports = router;
