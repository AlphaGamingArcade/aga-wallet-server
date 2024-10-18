const express = require("express")
const router = express.Router();
const bscController = require("./../../controllers/bsc.controller");
const { validate } = require("express-validation");
const { getAddress, accountListAssets } = require("../../validations/bsc.validation");

router.route('/')
    .get(bscController.get);

router.route('/address')
    .post(validate(getAddress), bscController.getAddress);

router.route('/assets')
    .get(bscController.listAssets);

router.route('/accounts/:address/assets')
    .get(validate(accountListAssets), bscController.accountListAssets);

module.exports = router