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
            account_id: Joi.string().required()
        })
    },
    getQuotePriceExactTokensForTokens: {
        body: Joi.object({
            pair: Joi.array().items(
                Joi.object({
                    Native: Joi.any().valid(null).optional(), // Native can be null
                    WithId: Joi.number().optional() // WithId can be a number
                }).xor('Native', 'WithId') // Ensure that either Native or WithId is present, but not both
            ).min(1).required(), // Ensure the pair array has at least one object
            amount: Joi.string().required(), // amount is required and must be a number
        })
    },
    
}