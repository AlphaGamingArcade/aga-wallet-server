const Joi = require('joi');

module.exports = {
  // GET /v1/wallet
  getWallet: {
    params: Joi.object({
        wallet_address: Joi.string().required(),
    }),
  },
  // GET /v1/wallet
  getWalletTransactions: {
    params: Joi.object({
        wallet_address: Joi.string().required()
    }),
    },
  // GET /v1/wallets
  getWallets: {
  
  },
  // POST /v1/wallets
  createWallet:{
    body: Joi.object({
        account_id: Joi.string().min(6).max(12).required(),
        password: Joi.string().min(6).required()
    })
  },
  listWallets: {
    query: Joi.object({
        limit: Joi.number().optional(),
        offset: Joi.number().optional(),
        order_by:  Joi.string().valid('asc', 'desc').optional(),
        sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
    }),
  }
}

