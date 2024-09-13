const expresss = require("express")
const { validate } = require('express-validation');
const accountController = require('../../controllers/account.controller');
const transactionController = require('../../controllers/transaction.controller');
const { getAccount } = require("../../validations/account.validation");
const { authorize } = require("../../middlewares/auth");
const { listAccountTransactions, sendTransaction } = require("../../validations/transaction.validation");
const { authorizeCloudMessaging } = require('../../middlewares/cloudMessaging');

const router = expresss.Router();

/**
 * Load account when API with account_address route parameter is hit
 */
router.param('account_address', accountController.load);

router.route('/:account_address')
  .get(authorize(), validate(getAccount), accountController.get);

router.route('/:account_address/transactions')
  .get(authorize(), validate(listAccountTransactions), transactionController.list);

router
  .route('/:account_address/transactions/send')
  .post(authorize(), validate(sendTransaction), authorizeCloudMessaging(), transactionController.send)

module.exports = router