const express = require("express")
const router = express.Router();
const networkController = require("./../../controllers/network.controller");
const { validate } = require("express-validation");
const { getNetwork, createNetwork, listNetworks } = require("../../validations/network.validation");

/**
 * Load network when API with account_address route parameter is hit
 */
router.param('network_id', networkController.load);

router.route('/')
    .get(validate(listNetworks), networkController.list);

router.route('/:network_id')
    .get(validate(getNetwork), networkController.get);

router.route('/register')
    .post(validate(createNetwork), networkController.create);

module.exports = router