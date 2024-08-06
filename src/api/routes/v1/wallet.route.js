const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../controllers/wallet.controller');
const { getWallet, createWallet, getWalletTransactions } = require('../../validations/wallet.validation');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * Load wallet when API with wallet_id route parameter is hit
 */
router.param('wallet_address', controller.load);

router
  .route('/:wallet_address')
  .get(authorize(), validate(getWallet), controller.get)

router
  .route('/:wallet_address/transactions')
  .get(authorize(), validate(getWalletTransactions), controller.getTransactions)

router.route('/create')
  .post(authorize(), validate(createWallet), controller.create);

module.exports = router;
