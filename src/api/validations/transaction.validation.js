const Joi = require('joi');

module.exports = {
  // GET /v1/transaction/:transaction_hash
  getTransaction: {
    body: Joi.object({
      transaction_hash: Joi.string().required()
    })
  },
  // GET /v1/transaction/:transaction_hash
  getTransaction: {
      body: Joi.object({
        transaction_hash: Joi.string().required()
      })
  },
  // POSST /v1/transaction/send
  sendTransaction: {
    params: Joi.object({
      account_address: Joi.string().required(),
    }),
    body: Joi.object({
        amount: Joi.number().required()
        .custom((value, helpers) => {
          // Check if the value has decimal places
          if (value % 1 !== 0) {
            // Convert to string and split by the decimal point
            const decimalPlaces = value.toString().split('.')[1].length;
            // Check if decimal places exceed 4
            if (decimalPlaces > 4) {
              return helpers.message('Amount can have a maximum of 4 decimal places');
            }
          }
          return value;
        }, 'Decimal Places Validation')
        .messages({
          'number.base': 'Amount must be a number',
          'any.required': 'Amount is required',
        }),
        destination_address: Joi.string().required(),
        password: Joi.string().min(6).required()
    })
  },
  listTransactions: {
    query: Joi.object({
        limit: Joi.number().optional(),
        offset: Joi.number().optional(),
        order_by:  Joi.string().valid('asc', 'desc').optional(),
        sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
    }),
}
}