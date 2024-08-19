const express = require('express');
const { validate } = require('express-validation');
const walletController = require('../../controllers/wallet.controller');
const transactionController = require('../../controllers/transaction.controller');
const { getWallet, createWallet, getWalletTransactions } = require('../../validations/wallet.validation');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * Load wallet when API with wallet_id route parameter is hit
 */
router.param('wallet_address', walletController.load);

router
  .route('/:wallet_address')
  .get(authorize(), validate(getWallet), walletController.get)

router
  .route('/:wallet_address/transactions')
  .get(authorize(), validate(getWalletTransactions), transactionController.list)

router.route('/create')
  .post(authorize(), validate(createWallet), walletController.create);

module.exports = router;
