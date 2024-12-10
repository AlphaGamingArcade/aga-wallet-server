const Joi = require("joi");

module.exports = {
    getAddress: {
        body: Joi.object({ 
            account_code: Joi.string().required(), 
            account_password: Joi.string().min(6).required()
        })
    },
    accountListAssets: {
        params: Joi.object({
            address: Joi.string().required()
        })
    },
    accountGetDepositFee: {
        params: Joi.object({
            address: Joi.string().required()
        }),
        body: Joi.object({
            amount: Joi.string().required(),
            recipient: Joi.string().required()
        })
    },
    accountCreateDeposit: {
        params: Joi.object({
            address: Joi.string().required()
        }),
        body: Joi.object({
            amount: Joi.string().required(),
            recipient: Joi.string().required()
        })
    }
}