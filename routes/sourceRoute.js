const sourceController = require("../controllers/sourceController");
const express = require("express");
const router = express.Router();

router.get("/fetchSources", sourceController.fetchSources);
router.post("/addSource", sourceController.addSource);

module.exports = router;
