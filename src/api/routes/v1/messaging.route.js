const express = require('express');
const router = express.Router();
const controller = require("../../controllers/messaging.controller");
const { getMessaging, listMessagings, createMessaging } = require('../../validations/messaging.validation');
const { authorize } = require('../../middlewares/auth');
const { validate } = require('express-validation');


/**
 * Load messaging when API with messaging_id route parameter is hit
 */
router.param('messaging_id', controller.load);

router
  .route('/')
  .get(authorize(), validate(listMessagings), controller.list)
  .post(authorize(), validate(createMessaging), controller.create);

router
  .route('/:messaging_id')
  .get(authorize(), validate(getMessaging), controller.get)

module.exports = router