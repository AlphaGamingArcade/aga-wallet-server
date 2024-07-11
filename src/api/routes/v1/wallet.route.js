const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../controllers/wallet.controller');
const { getWallet, createWallet } = require('../../validations/wallet.validation');

const router = express.Router();

/**
 * Load wallet when API with wallet_id route parameter is hit
 */
router.param('wallet_address', controller.load);

router
  .route('/:wallet_address')
  .get(validate(getWallet), controller.get)

router.route('/create')
  .post(validate(createWallet), controller.create);

module.exports = router;
