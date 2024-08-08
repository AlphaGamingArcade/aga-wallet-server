const express = require('express');
const router = express.Router();
const controller = require("../../controllers/asset.controller");
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const { getAsset } = require('../../validations/asset.validation');
const { validate } = require('express-validation');


/**
 * Load wallet when API with asset_id route parameter is hit
 */
router.param('asset_id', controller.load);

router.route('/')
  .get(authorize(), controller.getAssets);

router.route('/:asset_id')
  .get(authorize(), validate(getAsset), controller.get);

module.exports = router