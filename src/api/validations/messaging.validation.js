const Joi = require("joi");

module.exports = {
    // GET /v1/game/:game_id
    getMessaging: {
        params: Joi.object({
            game_id: Joi.number().required()
        })
    },
    registerMessaging: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    },
    updateMessaging: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    },
    replaceMessaging: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    },
    listMessagings: {
        query: Joi.object({
            limit: Joi.number().optional(),
            offset: Joi.number().optional(),
            order_by:  Joi.string().valid('asc', 'desc').optional(),
            sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional(),
            genre: Joi.string().regex(/^[A-Za-z_ ]+$/).optional()
        }),
    }
}