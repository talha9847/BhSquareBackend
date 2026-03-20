const loanController = require("../controllers/loanController");
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

router.post(
  "/uploadLoanDocuments",
  upload.any(),
  loanController.uploadLoanDocuments,
);
router.get(
  "/getLoanByCustomerId/:customerId",
  loanController.getLoanByCustomerId,
);
router.put("/updateLoan/:customerId", loanController.updateLoan);

router.patch("/approveLoan/:customerId", loanController.approveLoan);

router.put(
  "/completeLoanAndMoveToKitReady/:customerId",
  loanController.completeLoanAndMoveToKitReady,
);

module.exports = router;
