const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../controllers/transaction.controller');
const { sendTransaction, getTransaction } = require('../../validations/transaction.validation');

const router = express.Router();

/**
 * Load wallet when API with wallet_id route parameter is hit
 */
router.param('transaction_hash', controller.load);

router.route('/:transaction_hash')
  .get(validate(getTransaction), controller.get)

router
  .route('/send')
  .post(validate(sendTransaction), controller.send)

module.exports = router;
