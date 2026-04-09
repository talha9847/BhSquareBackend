const loanController = require("../controllers/loanController");
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const middleware = require("../middlewares/authMiddleware");

router.post(
  "/uploadLoanDocuments",
  upload.any(),
  middleware.authMiddleware(["admin"]),

  loanController.uploadLoanDocuments,
);
router.get(
  "/getLoanByCustomerId/:customerId",
  middleware.authMiddleware(["admin"]),

  loanController.getLoanByCustomerId,
);
router.put(
  "/updateLoan/:customerId",
  middleware.authMiddleware(["admin"]),
  loanController.updateLoan,
);

router.patch(
  "/approveLoan/:customerId",
  middleware.authMiddleware(["admin"]),
  loanController.approveLoan,
);

router.put(
  "/completeLoanAndMoveToKitReady/:customerId",
  middleware.authMiddleware(["admin"]),
  loanController.completeLoanAndMoveToKitReady,
);

router.get(
  "/fetchCustomerLoan/:customerId",
  middleware.authMiddleware(["admin"]),
  loanController.fetchCustomerLoan,
);

router.get(
  "/checkLoanAccess/:customer_id",
  middleware.authMiddleware(["admin", "source"]),
  loanController.checkLoanAccess,
);
module.exports = router;
