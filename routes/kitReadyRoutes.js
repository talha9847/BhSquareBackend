const kitReadyController = require("../controllers/kitReadyController");
const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
router.get(
  "/fetchKitReadyCustomers",
  kitReadyController.fetchKitReadyCustomers,
);
router.post("/updateLoan", kitReadyController.updateLoan);
router.post("/createInventory", kitReadyController.createInventory);
router.get("/getAllBrands", kitReadyController.getAllBrands);
router.get("/getAllInventory", kitReadyController.getAllInventory);
router.post("/createBrand", kitReadyController.createBrand);
router.put("/updateBrand/:id", kitReadyController.updateBrand);
router.delete("/deleteBrand/:id", kitReadyController.deleteBrand);
router.put("/updateInventory/:id", kitReadyController.updateInventory);
router.post("/addKitItems", kitReadyController.addKitItems);

router.get("/fetchKitItems/:customerId", kitReadyController.fetchKitItems);
router.get(
  "/fetchAvailableProducts/:customerId",
  kitReadyController.fetchAvailableProducts,
);

router.post("/addItem", kitReadyController.addItem);
router.post("/allocateItem", kitReadyController.allocateItem);
router.get(
  "/getPanelAndInventer/:customerId",
  kitReadyController.getPanelAndInventer,
);
router.post("/addCustomerSerials", kitReadyController.addCustomerSerials);

router.get(
  "/fetchKitItemsbyCustomer/:customerId",
  kitReadyController.fetchKitItemsbyCustomer,
);
router.get(
  "/fetchKitReadyCustomersByStatus",
  kitReadyController.fetchKitReadyCustomersByStatus,
);

router.post("/createCategory", kitReadyController.createCategory);
router.get("/getCategories", kitReadyController.getCategories);
router.put("/updateCategory/:id", kitReadyController.updateCategory);

module.exports = router;
