const Joi = require("joi");

module.exports = {
    // GET /v1/game/:game_id
    getMessaging: {
        params: Joi.object({
            messaging_id: Joi.number().required()
        })
    },
    // GET /v1/game/:game_id
    getUserMessaging: {
        params: Joi.object({
            user_id: Joi.number().required(),
            messaging_id: Joi.number().required()
        })
    },
    registerUserMessaging: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    },
    updateUserMessaging: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    },
    replaceUserMessaging: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    },
    listUserMessagings: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    }
}