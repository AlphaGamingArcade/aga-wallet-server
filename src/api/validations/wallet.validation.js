const Joi = require('joi');

module.exports = {
  // GET /v1/wallets
  getWallet: {
    params: Joi.object({
        wallet_address: Joi.string().required(),
    }),
  },

  // POST /v1/wallets
  createWallet:{
    body: Joi.object({
        user_id: Joi.number().required(),
        account_id: Joi.string().min(6).max(12).required(),
        password: Joi.string().required()
    })
  }
}
