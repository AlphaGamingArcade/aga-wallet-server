const express = require("express")
const router = express.Router();
const agaController = require("./../../controllers/aga.controller");
const { getAddress } = require("../../validations/bsc.validation");
const { validate } = require("express-validation");
const { getQuotePriceExactTokensForTokens } = require("../../validations/aga.validation");

router.route('/')
    .get(agaController.get);

router.route('/address')
    .post(validate(getAddress), agaController.getAddress);

router.route('/assets')
    .get(agaController.listAssets);

router.route('/accounts/:account_id/assets')
    .get(agaController.accountListAssets);


router.route('/swaps/pools')
    .get(agaController.getPools);

router.route('/swaps/quote-price-exact-token-for-tokens')
    .post(
        validate(getQuotePriceExactTokensForTokens), 
        agaController.getQuotePriceExactTokensForTokens
    );

module.exports = router