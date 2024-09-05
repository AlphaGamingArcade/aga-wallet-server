const express = require('express');
const { validate } = require('express-validation');
const userController = require('../../controllers/user.controller');
const notificationController = require('../../controllers/notification.controller');
const walletController = require('../../controllers/wallet.controller');
const messagingController = require('../../controllers/messaging.controller');
const accountController = require('../../controllers/account.controller')

const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');
const {
  listUsers,
  createUser,
  replaceUser,
  updateUser,
  getUser,
} = require('../../validations/user.validation');
const { getUserNotification, deleteUserNotification, listUserNotifications, updateUserNotification } = require('../../validations/notification.validator');
const { listWallets } = require('../../validations/wallet.validation');
const { listUserMessagings, getUserMessaging } = require('../../validations/messaging.validation');
const { listUserAccounts, getUserAccount, createUserAccount } = require('../../validations/account.validation');

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('user_id', userController.load);
router.param('notification_id', notificationController.load);
router.param('messaging_id', messagingController.load);
router.param('account_address', accountController.load);

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
 * User notifications
 */
router
  .route('/:user_id/notifications')
  .get(authorize(LOGGED_USER), validate(listUserNotifications), notificationController.listUserNotifications);

router
  .route('/:user_id/notifications/:notification_id')
  .get(authorize(LOGGED_USER), validate(getUserNotification), notificationController.get)
  .delete(authorize(LOGGED_USER), validate(deleteUserNotification), notificationController.remove)
  .patch(authorize(LOGGED_USER), validate(updateUserNotification), notificationController.patch);

/**
 * User Messagings
 */
router
  .route('/:user_id/messagings')
  .get(authorize(LOGGED_USER), validate(listUserMessagings), messagingController.listUserMessagings);

router
  .route('/:user_id/messagings/:messaging_id')
  .get(authorize(LOGGED_USER), validate(getUserMessaging), messagingController.get)

/**
 * User Accounts
 */
router
  .route('/:user_id/accounts')
  .get(authorize(LOGGED_USER), validate(listUserAccounts), accountController.listUserAccounts)
  .post(authorize(LOGGED_USER), validate(createUserAccount), accountController.create);

router
  .route('/:user_id/accounts/:account_address')
  .get(authorize(LOGGED_USER), validate(getUserAccount), accountController.get);
  
module.exports = router;
