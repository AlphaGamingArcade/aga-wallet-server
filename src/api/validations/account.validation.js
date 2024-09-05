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
}