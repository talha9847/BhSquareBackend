const wiringController = require("../controllers/wiringController");

const express = require("express");
const router = express.Router();

router.post("/createTechnician", wiringController.createTechnician);
router.get("/fetchTechnicians", wiringController.fetchTechnicians);
router.put("/updateTechnician/:id", wiringController.updateTechnician);
router.put("/updateWiring/:id", wiringController.updateWiring);
router.get(
  "/fetchWiringCustomerDetails",
  wiringController.fetchWiringCustomerDetails,
);



module.exports = router;
