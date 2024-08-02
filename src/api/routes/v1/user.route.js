const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../controllers/user.controller');
const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');
const {
  listUsers,
  createUser,
  replaceUser,
  updateUser,
} = require('../../validations/user.validation');

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('user_id', controller.load);

router
  .route('/')
  .get(validate(listUsers), authorize(ADMIN),  controller.list)
  .post(validate(createUser), authorize(ADMIN),  controller.create);

router
  .route('/profile')
  .get(authorize(), controller.loggedIn);


router
  .route('/:user_id/wallets')
  .get(authorize(), controller.wallets);

router
  .route('/:user_id')
  .get(authorize(LOGGED_USER), controller.get)
  .put(authorize(LOGGED_USER), validate(replaceUser), controller.replace)
  .patch(authorize(LOGGED_USER), validate(updateUser), controller.update)
  .delete(authorize(LOGGED_USER), controller.remove);

module.exports = router;
