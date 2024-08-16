const express = require('express');
const router = express.Router();
const controller = require("../../controllers/notification.controller");
const { authorize } = require('../../middlewares/auth');
const { validate } = require('express-validation');
const { getNotification, deleteNotification, updateNotification } = require('../../validations/notification.validator');

/**
 * Load wallet when API with asset_id route parameter is hit
 */
router.param('notification_id', controller.load);

// router.route('/:notification_id')
//   .get(authorize(), validate(getNotification), controller.get)
//   .delete(authorize(), validate(deleteNotification), controller.delete)
//   .put(authorize(), validate(updateNotification), controller.put);

router.route('/')
  .get(authorize(), controller.getNotifications);

module.exports = router