const wiringController = require("../controllers/wiringController");
const middleware = require("../middlewares/authMiddleware");
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

router.post(
  "/createTechnician",
  middleware.authMiddleware(["admin"]),
  wiringController.createTechnician,
);
router.get(
  "/fetchTechnicians",
  middleware.authMiddleware(["admin"]),
  wiringController.fetchTechnicians,
);
router.put(
  "/updateTechnician/:id",
  middleware.authMiddleware(["admin"]),
  wiringController.updateTechnician,
);
router.get(
  "/fetchWiringCustomerDetails",
  middleware.authMiddleware(["admin"]),
  wiringController.fetchWiringCustomerDetails,
);

router.post(
  "/createWireInventory",
  middleware.authMiddleware(["admin"]),
  wiringController.createWireInventory,
);
router.get(
  "/fetchAllWireInventory",
  middleware.authMiddleware(["admin"]),
  wiringController.fetchAllWireInventory,
);
router.get(
  "/getAvailableWireInventory/:id",
  middleware.authMiddleware(["admin", "technician"]),
  wiringController.getAvailableWireInventory,
);

router.put(
  "/updateWireInventory/:id",
  middleware.authMiddleware(["admin"]),
  wiringController.updateWireInventory,
);
router.post(
  "/createWiringItem",
  middleware.authMiddleware(["admin", "technician"]),
  wiringController.createWiringItem,
);
router.put(
  "/updateTechni/:wiringId",
  middleware.authMiddleware(["admin"]),
  wiringController.updateTechni,
);
router.get(
  "/fetchIssuedWires/:id",
  middleware.authMiddleware(["admin", "technician"]),
  wiringController.fetchIssuedWires,
);
router.put(
  "/updateInventoryStatus/:wiringId",
  middleware.authMiddleware(["admin", "technician"]),
  wiringController.updateInventoryStatus,
);
router.post(
  "/uploadWiringDocs",
  upload.single("file"),
  middleware.authMiddleware(["admin", "technician"]),
  wiringController.uploadWiringDocController,
);

router.get(
  "/getWiringDocs/:id",
  middleware.authMiddleware(["admin", "technician"]),
  wiringController.getWiringDocs,
);

router.post(
  "/moveToFinalStage",
  middleware.authMiddleware(["admin"]),
  wiringController.moveToFinalStage,
);

router.get(
  "/getWiringCustomerDetailsById",
  middleware.authMiddleware(["technician"]),
  wiringController.getWiringCustomerDetailsById,
);
router.get(
  "/getPendingCommissions",
  middleware.authMiddleware(["admin"]),
  wiringController.getPendingCommissions,
);
router.get(
  "/getFabricationDetailsById",
  middleware.authMiddleware(["fabricator"]),
  wiringController.getFabricationDetailsById,
);
module.exports = router;
