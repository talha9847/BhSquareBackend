const dispatchController = require("../controllers/dispatchController");
const middleware = require("../middlewares/authMiddleware");
const express = require("express");
const router = express.Router();

router.get(
  "/fetchDispatches",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.fetchDispatches,
);
router.post(
  "/updateDispatch",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.updateDispatch,
);
router.post(
  "/createFabricator",
  middleware.authMiddleware(["admin"]),
  dispatchController.createFabricator,
);
router.get(
  "/fetchFabricators",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.fetchFabricators,
);
router.put(
  "/updateFabricator/:id",
  middleware.authMiddleware(["admin"]),
  dispatchController.updateFabricator,
);
router.get(
  "/fetchFabrications",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.fetchFabrications,
);
router.put(
  "/updateFabrication",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.updateFabrication,
);
router.put(
  "/updateFabricatorViaId",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.updateFabricatorViaId,
);
router.post(
  "/createDriver",
  middleware.authMiddleware(["admin"]),
  dispatchController.createDriver,
);
router.post(
  "/createCar",
  middleware.authMiddleware(["admin"]),
  dispatchController.createCar,
);
router.get(
  "/fetchDrivers",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.fetchDrivers,
);
router.get(
  "/fetchCars",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.fetchCars,
);
router.put(
  "/updateDriver/:id",
  middleware.authMiddleware(["admin"]),
  dispatchController.updateDriver,
);
router.put(
  "/updateCar/:id",
  middleware.authMiddleware(["admin"]),
  dispatchController.updateCar,
);
router.get(
  "/fetchDispatchesByStatus",
  middleware.authMiddleware(["admin"]),
  dispatchController.fetchDispatchesByStatus,
);
router.delete(
  "/deleteKitItem/:kitItemId",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.deleteKitItem,
);
router.put(
  "/updateKitItemQty",
  middleware.authMiddleware(["admin", "site_supervisor"]),
  dispatchController.updateKitItemQty,
);
router.get(
  "/getFabricationsByStatus",
  middleware.authMiddleware(["admin"]),
  dispatchController.getFabricationsByStatus,
);
router.get(
  "/getDispatchByCustomerId/:customerId",
  middleware.authMiddleware(["admin", "technician"]),
  dispatchController.getDispatchByCustomerId,
);
router.get(
  "/getFabricationByCustomerId/:customerId",
  middleware.authMiddleware(["admin", "technician"]),
  dispatchController.getFabricationByCustomerId,
);

module.exports = router;
