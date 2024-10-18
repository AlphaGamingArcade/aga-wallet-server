const express = require('express');
const router = express.Router();
const controller = require("../../controllers/asset.controller");
const { authorize } = require('../../middlewares/auth');
const { getAsset, listAssets, registerAsset } = require('../../validations/asset.validation');
const { validate } = require('express-validation');

/**
 * Load wallet when API with asset_id route parameter is hit
 */
router.param('asset_id', controller.load);

router.route('/')
  .get(validate(listAssets), controller.list);

router.route('/register')
  .post(authorize(), validate(registerAsset), controller.register);

router.route('/:asset_id')
  .get(authorize(), validate(getAsset), controller.get);

module.exports = router