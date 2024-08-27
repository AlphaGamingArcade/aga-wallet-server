const express = require('express');
const router = express.Router();
const controller = require("../../controllers/messaging.controller");
const { authorize } = require('../../middlewares/auth');
const { validate } = require('express-validation');
const { getMessaging, updateMessaging, replaceMessaging, registerMessaging } = require('../../validations/messaging.validation');


/**
 * Load messaging when API with messaging_id route parameter is hit
 */
router.param('messaging_id', controller.load);

router.route('/register', validate(registerMessaging), controller.register)

router.route('/:messaging_id')
  .get(authorize(), validate(getMessaging), controller.get)
  .patch(authorize(), validate(updateMessaging), controller.update)
  .put(authorize(), validate(replaceMessaging), controller.replace);

module.exports = router