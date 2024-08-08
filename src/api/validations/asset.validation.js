const Joi = require("joi");

module.exports = {
    // GET /v1/transaction/:transaction_hash
    getAsset: {
        params: Joi.object({
            asset_id: Joi.number().required()
        })
    },
}