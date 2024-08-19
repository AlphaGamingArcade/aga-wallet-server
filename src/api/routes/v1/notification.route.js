const express = require('express');
const router = express.Router();
const controller = require("../../controllers/notification.controller");
const { authorize } = require('../../middlewares/auth');
const { validate } = require('express-validation');
const { listNotifications } = require('../../validations/notification.validator');

router.route('/')
  .get(authorize(), validate(listNotifications), controller.list);

module.exports = router