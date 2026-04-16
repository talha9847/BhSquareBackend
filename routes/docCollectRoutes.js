const docCollectController = require("../controllers/docCollectController");

const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

router.get(
  "/getLeadDetailFromCustomerId/:customer_id",
  middleware.authMiddleware(["admin"]),
  docCollectController.getLeadDetailFromCustomerId,
);
router.get(
  "/getCustomerDocumentByCustomerId/:customer_id",
  middleware.authMiddleware(["admin", "source"]),
  docCollectController.getCustomerDocumentByCustomerId,
);
router.put(
  "/upsertCustomerDocument/",
  middleware.authMiddleware(["admin", "source"]),
  docCollectController.upsertCustomerDocument,
);
router.post(
  "/uploadDocsToDrive/",
  upload.any(),
  middleware.authMiddleware(["admin", "source"]),
  docCollectController.uploadDocsToDrive,
);

router.post(
  "/completeStageAndPrepareNext",
  middleware.authMiddleware(["admin"]),
  docCollectController.completeStageAndPrepareNext,
);

router.get(
  "/checkDocumentCollectionAccess/:customer_id",
  middleware.authMiddleware(["admin", "source"]),
  docCollectController.checkDocumentCollectionAccess,
);
router.get(
  "/checkDocAccess/:customer_id",
  middleware.authMiddleware(["admin", "source"]),
  docCollectController.checkDocAccess,
);
router.get(
  "/fetchCustomerDocuments/:customerId",
  middleware.authMiddleware(["admin"]),
  docCollectController.fetchCustomerDocuments,
);
router.post(
  "/backup",
  middleware.authMiddleware(["admin"]),
  docCollectController.backup,
);
router.get(
  "/getBackup",
  middleware.authMiddleware(["admin"]),
  docCollectController.getBackup,
);

module.exports = router;
