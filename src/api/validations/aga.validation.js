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
    }
}