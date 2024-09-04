const expresss = require("express")
const { validate } = require('express-validation');
const controller = require('../../controllers/account.controller')

const router = expresss.Router();

/**
 * Load wallet when API with asset_id route parameter is hit
 */
router.param('account_id', controller.load);

module.exports = router