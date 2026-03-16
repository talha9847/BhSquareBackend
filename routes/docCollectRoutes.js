const docCollectRoutes = require("../controllers/docCollectController");

const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");

router.get(
  "/getLeadDetailFromCustomerId/:customer_id",
  docCollectRoutes.getLeadDetailFromCustomerId,
);
router.get(
  "/getCustomerDocumentByCustomerId/:customer_id",
  docCollectRoutes.getCustomerDocumentByCustomerId,
);
router.put("/upsertCustomerDocument/", docCollectRoutes.upsertCustomerDocument);
router.post(
  "/uploadDocsToDrive/",
  upload.any(),
  docCollectRoutes.uploadDocsToDrive,
);

router.post(
  "/completeStageAndPrepareNext",
  docCollectRoutes.completeStageAndPrepareNext,
);

module.exports = router;
