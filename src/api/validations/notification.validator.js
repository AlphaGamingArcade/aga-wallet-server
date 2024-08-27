const Joi = require("joi");

module.exports = {
    listNotifications: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
        })
    },
    //FOR USER
    listUserNotifications: {
        params: Joi.object({
            user_id: Joi.number().required()
        }),
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
        }),
    },
    // GET /v1/transaction/:transaction_hash
    getUserNotification: {
        params: Joi.object({
            user_id: Joi.number().required(),
            notification_id: Joi.number().required()
        })
    },
    deleteUserNotification: {
        params: Joi.object({
            user_id: Joi.number().required(),
            notification_id: Joi.number().required()
        })
    },
    updateUserNotification: {
        params: Joi.object({
            user_id: Joi.number().required(),
            notification_id: Joi.number().required()
        }),
        body: Joi.object({
            status: Joi.string().required()
        })
    }
}