const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../controllers/user.controller');
const notificationController = require('../../controllers/notification.controller')
const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');
const {
  listUsers,
  createUser,
  replaceUser,
  updateUser,
  getUser,
} = require('../../validations/user.validation');
const { getNotification, deleteNotification, updateNotification, listNotifications } = require('../../validations/notification.validator');

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('user_id', controller.load);
router.param('notification_id', notificationController.load);

router
  .route('/')
  .get(validate(listUsers), authorize(ADMIN),  controller.list)
  .post(validate(createUser), authorize(ADMIN),  controller.create);

router
  .route('/profile')
  .get(authorize(), controller.loggedIn);


router
  .route('/:user_id')
  .get(authorize(LOGGED_USER), validate(getUser), controller.get)
  .put(authorize(LOGGED_USER), validate(replaceUser), controller.replace)
  .patch(authorize(LOGGED_USER), validate(updateUser), controller.update)
  .delete(authorize(LOGGED_USER), controller.remove);

router
  .route('/:user_id/wallets')
  .get(authorize(LOGGED_USER), controller.wallets);

/**
 * NOTIFICATIONS
 */
router
  .route('/:user_id/notifications')
  .get(authorize(LOGGED_USER), validate(listNotifications), controller.notifications);

router
  .route('/:user_id/notifications/:notification_id')
  .get(authorize(LOGGED_USER), validate(getNotification), notificationController.get)
  .delete(authorize(LOGGED_USER), validate(deleteNotification), notificationController.remove)
  .patch(authorize(LOGGED_USER), validate(updateNotification), notificationController.patch);

module.exports = router;
