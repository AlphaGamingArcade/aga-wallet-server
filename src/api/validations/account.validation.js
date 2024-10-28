const Joi = require("joi");

module.exports = {
    getAccount: {
        params: Joi.object({
            account_address: Joi.string().required()
        })
    },
    createAccount: {
        body: Joi.object({
            account_id: Joi.string().min(6).max(12).required(),
            password: Joi.string().min(6).required()
        })
    },
    listAccounts: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
        })
    },
    listUserAccounts: {
        params: Joi.object({
            user_id: Joi.number().required()
        }),
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
        })
    },
    // GET /v1/users/:user_id/accounts/:account_id
    getUserAccount: {
        params: Joi.object({
            user_id: Joi.number().required(),
            account_address: Joi.string().required()
        })
    },
    // POST /v1/users/:user_id/accounts/:account_id
    createUserAccount: {
        params: Joi.object({
            user_id: Joi.number().required()
        }),
        body: Joi.object({
            account_code: Joi.string().min(6).max(12).required(),
            account_password: Joi.string().min(6).max(64).required()
        })
    },

    // POST /v1/users/:user_id/accounts/:account_id/swaps/swap-exact-tokens-for-tokens
    accountSwapExactTokensForTokens: {
        params: Joi.object({
            account_address: Joi.string().required()
        }),
        body: Joi.object({
            pair: Joi.array().items(
                Joi.object({
                    Native: Joi.any().valid(null).optional(), // Native can be null
                    WithId: Joi.number().optional() // WithId can be a number
                }).xor('Native', 'WithId') // Ensure that either Native or WithId is present, but not both
            ).min(1).required(), // Ensure the pair array has at least one object
            amount_in: Joi.string().required(), // amount is required and must be a number
            amount_out_min: Joi.string().required(), // amount is required and must be a number
            password: Joi.string().required()
        })
    },
    accountAddLiquidityPool: {
        params: Joi.object({
            account_address: Joi.string().required()
        }),
        body: Joi.object({
            pair: Joi.array().items(
                Joi.object({
                    Native: Joi.any().valid(null).optional(), // Native can be null
                    WithId: Joi.number().optional() // WithId can be a number
                }).xor('Native', 'WithId') // Ensure that either Native or WithId is present, but not both
            ).min(1).required(), // Ensure the pair array has at least one object
            amount1_desired: Joi.string().required(), 
            amount2_desired: Joi.string().required(), 
            amount1_min: Joi.string().required(), 
            amount2_min: Joi.string().required(),
            password: Joi.string().required()
        })
    }
}