const docCollectController = require("../controllers/docCollectController");

const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");

router.get(
  "/getLeadDetailFromCustomerId/:customer_id",
  docCollectController.getLeadDetailFromCustomerId,
);
router.get(
  "/getCustomerDocumentByCustomerId/:customer_id",
  docCollectController.getCustomerDocumentByCustomerId,
);
router.put("/upsertCustomerDocument/", docCollectController.upsertCustomerDocument);
router.post(
  "/uploadDocsToDrive/",
  upload.any(),
  docCollectController.uploadDocsToDrive,
);

router.post(
  "/completeStageAndPrepareNext",
  docCollectController.completeStageAndPrepareNext,
);

router.get(
  "/checkDocumentCollectionAccess/:customer_id",
  docCollectController.checkDocumentCollectionAccess,
);
router.get(
  "/checkDocAccess/:customer_id",
  docCollectController.checkDocAccess,
);
router.get(
  "/fetchCustomerDocuments/:customerId",
  docCollectController.fetchCustomerDocuments,
);

module.exports = router;
