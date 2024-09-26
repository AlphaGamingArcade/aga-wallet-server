const Joi = require("joi");

module.exports = {
    accountListAssets: {
        params: Joi.object({
            account_id: Joi.string().required()
        })
    }
}