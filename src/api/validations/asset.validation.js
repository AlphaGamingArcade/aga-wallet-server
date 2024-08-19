const Joi = require("joi");

module.exports = {
    // GET /v1/transaction/:transaction_hash
    getAsset: {
        params: Joi.object({
            asset_id: Joi.number().required()
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