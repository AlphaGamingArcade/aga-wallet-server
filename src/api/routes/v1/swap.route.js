const express = require('express');
const router = express.Router();
const controller = require("../../controllers/swap.controller");
const { authorize } = require('../../middlewares/auth');
const { swapChecker } = require('../../middlewares/swapChecker');

router
    .route('/')
    .get(swapChecker, controller.listSwaps)
module.exports = router