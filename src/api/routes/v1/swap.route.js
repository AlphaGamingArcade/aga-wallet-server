const express = require('express');
const router = express.Router();
const controller = require("../../controllers/swap.controller");
const { swapAssets } = require('../../validations/swap.validation');
const { authorize } = require('../../middlewares/auth');
const { validate } = require('express-validation');

router.route ('/')
    .get(controller.listSwaps)

router.route('/token')
    .get(validate(swapAssets), controller.swapToken)
    .post(authorize(), validate(swapAssets), controller.swapToken)

module.exports = router
