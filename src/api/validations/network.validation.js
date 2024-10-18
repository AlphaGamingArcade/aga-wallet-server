const Joi = require("joi");

module.exports = {
    getNetwork: {
        params: Joi.object({
           network_id: Joi.number().required()
        })
    },
    createNetwork: {
        body: Joi.object({
            network_name: Joi.string().required(),
            network_native_token_symbol: Joi.string().required(),
            network_rpc_url: Joi.string().required(),
            network_type: Joi.string().required(),
        })
    },
    listNetworks: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
        })
    }
}