const Joi = require('joi');

module.exports = {
  // GET /v1/wallets
  sendTransaction: {
    body: Joi.object({
        amount: Joi.number().required(),
        recipient_address: Joi.string().required()
    })
  }
}