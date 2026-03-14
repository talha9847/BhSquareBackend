const leadController = require("../controllers/leadController");
const express = require("express");

const router = express.Router();

router.post("/addLead", leadController.addLead);
router.get("/fetchPendingLeads", leadController.fetchPendingLeads);
router.get("/fetchLeadsByStatus", leadController.fetchLeadsByStatus);

module.exports = router;
