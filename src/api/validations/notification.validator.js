const Joi = require("joi");

module.exports = {
    // GET /v1/transaction/:transaction_hash
    getNotification: {
        params: Joi.object({
            user_id: Joi.number().required(),
            notification_id: Joi.number().required()
        })
    },
    deleteNotification: {
        params: Joi.object({
            user_id: Joi.number().required(),
            notification_id: Joi.number().required()
        })
    },
    updateNotification: {
        params: Joi.object({
            user_id: Joi.number().required(),
            notification_id: Joi.number().required()
        }),
        body: Joi.object({
            status: Joi.string().required()
        })
    }
}