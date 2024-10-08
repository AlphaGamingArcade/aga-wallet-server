const Joi = require('joi');

module.exports = {
  // POST /v1/auth/register
  register: {
    body: Joi.object({
      name: Joi.string()
        .min(3)
        .required(),
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .min(6)
        .max(128),
    }),
  },

  // POST /v1/auth/login
  login: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .max(128),
    }),
  },

  // POST /v1/auth/facebook
  // POST /v1/auth/google
  oAuth: {
    body: Joi.object({
      access_token: Joi.string().required(),
    }),
  },

  // POST /v1/auth/refresh
  refresh: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      refresh_token: Joi.string().required(),
    }),
  },

  // POST /v1/auth/refresh
  sendPasswordReset: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
    }),
  },

  // POST /v1/auth/password-reset
  passwordReset: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required(),
      password: Joi.string()
        .required()
        .min(6)
        .max(128),
      resetToken: Joi.string().required(),
    }),
  },
  list: {
    query: Joi.object({
        limit: Joi.number().optional(),
        offset: Joi.number().optional(),
        order_by:  Joi.string().valid('asc', 'desc').optional(),
        sort_by: Joi.string().regex(/^[A-Za-z_]+$/).optional()
    }),
  }
};
