const Joi = require('joi');

module.exports = {
  // GET /v1/users
  listUsers: {
    query: Joi.object({
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      name: Joi.string(),
      email: Joi.string(),
      role: Joi.string().valid('admin', 'user', 'guest')
    }),
  },

   // POST /v1/users/:user_id
   getUser: {
    params: Joi.object({
      user_id: Joi.number().required()
    })
  },


  // POST /v1/users
  createUser: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      name: Joi.string().max(128),
      role: Joi.string().valid('admin', 'user', 'guest')
    }),
  },

  // PUT /v1/users/:userId
  replaceUser: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      name: Joi.string().max(128),
      role: Joi.string().valid('admin', 'user', 'guest')
    }),
    params: Joi.object({
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    }),
  },

  // PATCH /v1/users/:userId
  updateUser: {
    body: Joi.object({
      email: Joi.string().email(),
      password: Joi.string().min(6).max(128),
      name: Joi.string().max(128),
      role: Joi.string().valid('admin', 'user', 'guest')
    }),
    params: Joi.object({
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    }),
  },
};
