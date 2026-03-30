const wiringController = require("../controllers/wiringController");

const express = require("express");
const router = express.Router();

router.post("/createTechnician", wiringController.createTechnician);
router.get("/fetchTechnicians", wiringController.fetchTechnicians);
router.put("/updateTechnician/:id", wiringController.updateTechnician);
router.get(
  "/fetchWiringCustomerDetails",
  wiringController.fetchWiringCustomerDetails,
);

router.post("/createWireInventory", wiringController.createWireInventory);
router.get("/fetchAllWireInventory", wiringController.fetchAllWireInventory);
router.get(
  "/getAvailableWireInventory/:id",
  wiringController.getAvailableWireInventory,
);

router.put("/updateWireInventory/:id", wiringController.updateWireInventory);
router.post("/createWiringItem", wiringController.createWiringItem);
router.put("/updateTechni/:wiringId", wiringController.updateTechni);
router.get("/fetchIssuedWires/:id", wiringController.fetchIssuedWires);
module.exports = router;
