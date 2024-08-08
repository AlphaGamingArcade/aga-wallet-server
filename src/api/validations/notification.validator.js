const Joi = require("joi");

module.exports = {
    // GET /v1/transaction/:transaction_hash
    getNotification: {
        params: Joi.object({
            notification_id: Joi.number().required()
        })
    },
    deleteNotification: {
        params: Joi.object({
            notification_id: Joi.number().required()
        })
    },
    updateNotification: {
        params: Joi.object({
            notification_id: Joi.number().required()
        })
    }
}