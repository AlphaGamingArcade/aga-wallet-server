const express = require('express');
const { validate } = require('express-validation');
const userController = require('../../controllers/user.controller');
const notificationController = require('../../controllers/notification.controller')
const walletController = require('../../controllers/wallet.controller')
const messagingController = require('../../controllers/messaging.controller')
const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');
const {
  listUsers,
  createUser,
  replaceUser,
  updateUser,
  getUser,
} = require('../../validations/user.validation');
const { getNotification, deleteNotification, updateNotification, listNotifications } = require('../../validations/notification.validator');
const { listWallets } = require('../../validations/wallet.validation');
const { listMessagings } = require('../../validations/messaging.validation');

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('user_id', userController.load);
router.param('notification_id', notificationController.load);

router
  .route('/')
  .get(validate(listUsers), authorize(ADMIN),  userController.list)
  .post(validate(createUser), authorize(ADMIN),  userController.create);

router
  .route('/profile')
  .get(authorize(), userController.loggedIn);

router
  .route('/:user_id')
  .get(authorize(LOGGED_USER), validate(getUser), userController.get)
  .put(authorize(LOGGED_USER), validate(replaceUser), userController.replace)
  .patch(authorize(LOGGED_USER), validate(updateUser), userController.update)
  .delete(authorize(LOGGED_USER), userController.remove);

router
  .route('/:user_id/wallets')
  .get(authorize(LOGGED_USER), validate(listWallets), walletController.listUserWallets);

/**
 * NOTIFICATIONS
 */
router
  .route('/:user_id/notifications')
  .get(authorize(LOGGED_USER), validate(listNotifications), notificationController.listUserNotifications);

router
  .route('/:user_id/notifications/:notification_id')
  .get(authorize(LOGGED_USER), validate(getNotification), notificationController.get)
  .delete(authorize(LOGGED_USER), validate(deleteNotification), notificationController.remove)
  .patch(authorize(LOGGED_USER), validate(updateNotification), notificationController.patch);

/**
 * Messaging
 */
router
  .route('/:user_id/messagings')
  .get(authorize(LOGGED_USER), validate(listMessagings), messagingController.listUserMessagings);

// router
//   .route('/:user_id/notifications/:notification_id')
//   .get(authorize(LOGGED_USER), validate(getNotification), notificationController.get)
//   .delete(authorize(LOGGED_USER), validate(deleteNotification), notificationController.remove)
//   .patch(authorize(LOGGED_USER), validate(updateNotification), notificationController.patch);


module.exports = router;
