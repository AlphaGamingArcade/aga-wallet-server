const Joi = require("joi");

module.exports = {
    // GET /v1/transaction/:transaction_hash
    getAsset: {
        params: Joi.object({
            asset_id: Joi.number().required()
        })
    },
    // GET /v1/transaction/:transaction_hash
    registerAsset: {
        body: Joi.object({
            asset_network_id: Joi.number().required(),
            asset_name:  Joi.string().required(),
            asset_symbol:  Joi.string().required(),
            asset_native:  Joi.string().valid('y', 'n').required(),
            asset_contract:  Joi.string().allow(null),
        })
    },
    listAssets: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
        }),
    }
}