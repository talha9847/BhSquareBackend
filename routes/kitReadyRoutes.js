const kitReadyController = require("../controllers/kitReadyController");
const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
router.get(
  "/fetchKitReadyCustomers",
  kitReadyController.fetchKitReadyCustomers,
);
router.delete(
  "/deleteCustomerData/:customerId",
  middleware.authMiddleware(["admin"]),
  kitReadyController.deleteCustomerData,
);
router.post(
  "/updateKitReadyStatusDelay/:id",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateKitReadyStatusDelay,
);
router.post(
  "/updateLoan",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateLoan,
);
router.post(
  "/updateLoanFromRegistration",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateLoanFromRegistration,
);
router.post(
  "/createInventory",
  middleware.authMiddleware(["admin"]),
  kitReadyController.createInventory,
);
router.get(
  "/getAllBrands",
  middleware.authMiddleware(["admin"]),
  kitReadyController.getAllBrands,
);
router.get(
  "/getAllInventory",
  middleware.authMiddleware(["admin"]),
  kitReadyController.getAllInventory,
);
router.post(
  "/createBrand",
  middleware.authMiddleware(["admin"]),
  kitReadyController.createBrand,
);
router.put(
  "/updateBrand/:id",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateBrand,
);
router.delete(
  "/deleteBrand/:id",
  middleware.authMiddleware(["admin"]),
  kitReadyController.deleteBrand,
);
router.put(
  "/updateInventory/:id",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateInventory,
);
router.post(
  "/addKitItems",
  middleware.authMiddleware(["admin"]),
  kitReadyController.addKitItems,
);

router.get(
  "/fetchKitItems/:customerId",
  middleware.authMiddleware(["admin"]),
  kitReadyController.fetchKitItems,
);
router.get(
  "/fetchAvailableProducts/:customerId",
  middleware.authMiddleware(["admin"]),
  kitReadyController.fetchAvailableProducts,
);

router.post(
  "/addItem",
  middleware.authMiddleware(["admin"]),
  kitReadyController.addItem,
);
router.post(
  "/allocateItem",
  middleware.authMiddleware(["admin"]),
  kitReadyController.allocateItem,
);
router.get(
  "/getPanelAndInventer/:customerId",
  middleware.authMiddleware(["admin"]),
  kitReadyController.getPanelAndInventer,
);
router.post(
  "/addCustomerSerials",
  middleware.authMiddleware(["admin"]),
  kitReadyController.addCustomerSerials,
);

router.get(
  "/fetchKitItemsbyCustomer/:customerId",
  middleware.authMiddleware(["admin", "technician"]),
  kitReadyController.fetchKitItemsbyCustomer,
);
router.get(
  "/fetchKitReadyCustomersByStatus",
  middleware.authMiddleware(["admin"]),
  kitReadyController.fetchKitReadyCustomersByStatus,
);

router.post(
  "/createCategory",
  middleware.authMiddleware(["admin"]),
  kitReadyController.createCategory,
);
router.get(
  "/getCategories",
  middleware.authMiddleware(["admin"]),
  kitReadyController.getCategories,
);
router.put(
  "/updateCategory/:id",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateCategory,
);

router.put(
  "/updateSingleSerial",
  middleware.authMiddleware(["admin"]),
  kitReadyController.updateSingleSerial,
);

router.get(
  "/fetchCustomerSerials/:customerId",
  middleware.authMiddleware(["admin"]),
  kitReadyController.fetchCustomerSerials,
);
router.get(
  "/getKitByCustomerId/:customerId",
  middleware.authMiddleware(["admin", "technician"]),
  kitReadyController.getKitByCustomerId,
);
router.post(
  "/createUnusedInventory",
  middleware.authMiddleware(["admin", "technician"]),
  kitReadyController.createUnusedInventory,
);

router.get(
  "/getUnusedInventoryByCustomerId/:customerId",
  middleware.authMiddleware(["admin", "technician"]),
  kitReadyController.getUnusedInventoryByCustomerId,
);
router.delete(
  "/deleteUnusedInventory",
  middleware.authMiddleware(["admin", "technician"]),
  kitReadyController.deleteUnusedInventory,
);
module.exports = router;
