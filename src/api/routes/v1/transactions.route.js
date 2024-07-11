const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../controllers/transaction.controller');
const { sendTransaction } = require('../../validations/transaction.validation');

const router = express.Router();

router
  .route('/send')
  .get(validate(sendTransaction), controller.send)

module.exports = router;
