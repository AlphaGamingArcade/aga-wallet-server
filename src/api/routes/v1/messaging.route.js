const express = require('express');
const router = express.Router();
const controller = require("../../controllers/messaging.controller");


/**
 * Load messaging when API with messaging_id route parameter is hit
 */
router.param('messaging_id', controller.load);

module.exports = router