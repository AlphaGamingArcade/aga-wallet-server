const Joi = require("joi");

module.exports = {
    // GET /v1/game/:game_id
    getGame: {
        params: Joi.object({
            game_id: Joi.number().required()
        })
    },
}