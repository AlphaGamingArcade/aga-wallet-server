const Joi = require('joi');

module.exports = {
  // /v1/token
  swapAssets: {
    body: Joi.object({
      pair: Joi.array()
        .items(
          Joi.object().keys({
            Native: Joi.any().valid(null).optional(),
            WithId: Joi.number().optional(),
          }).or('Native', 'WithId')
        )
        .length(2)
        .required(),
      amount: Joi.string().required(),
      include_fee: Joi.string().valid('true', 'false').required(),
    }),
  },
};