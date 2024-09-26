const express = require("express")
const router = express.Router();
const agaController = require("./../../controllers/aga.controller")

router.route('/')
    .get(agaController.get);

router.route('/assets')
    .get(agaController.listAssets);

router.route('/accounts/:account_id/assets')
    .get(agaController.accountListAssets);

module.exports = router