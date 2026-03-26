const dispatchController = require("../controllers/dispatchController");

const express = require("express");
const router = express.Router();

router.get("/fetchDispatches", dispatchController.fetchDispatches);
router.post("/updateDispatch", dispatchController.updateDispatch);

module.exports = router;
