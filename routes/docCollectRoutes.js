const docCollectRoutes = require("../controllers/docCollectController");

const express = require("express");
const router = express.Router();

router.get(
  "/getLeadDetailFromCustomerId/:customer_id",
  docCollectRoutes.getLeadDetailFromCustomerId,
);

module.exports = router;
