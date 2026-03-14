const sourceController = require("../controllers/sourceController");
const express = require("express");
const router = express.Router();

router.get("/fetchSources", sourceController.fetchSources);

module.exports = router;
