const httpStatus = require("http-status");
const Messaging = require("../models/messaging.model");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");
const Game = require("../models/game.model");

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, id) => {
    try {
      const messaging = await Messaging.getById(id);
      req.locals = { messaging }
      return next();
    } catch (error) {
      return next(error);
    }
};

/**
 * Get asset
 * @public
 */
exports.get = (req, res) => res.json(req.locals.messaging);

/**
 * Register messaging
 */
exports.create = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const token = req.body.messaging_token;

    const messaging = await Messaging.save({
      userId,
      token,
      status: 'a'
    });

    res.status(httpStatus.OK);
    return res.json(messaging);
  } catch (error) {
    return next(Messaging.checkDuplicateMessaging(error))
  }
}

/**
 * Update messaging
 */
exports.update = async (req, res, next) => {
  try {
    const messaging = {}

    res.status(httpStatus.OK);
    return res.json(messaging);
  } catch (error) {
    return next(error)
  }
}

/**
 * Update messaging
 */
exports.replace = async (req, res, next) => {
  try {
    const messaging = {}

    res.status(httpStatus.OK);
    return res.json(messaging);
  } catch (error) {
    return next(error)
  }
}


/**
 * Gets all messagings
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const { query } = req
    const messagings = await Messaging.list({
      condition: "1=1",
      sortBy: query.sort_by || "messaging_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json(messagings);
  } catch (error) {
    next(error)
  }
};

exports.listUserMessagings = async (req, res, next) => {
  try {
    const { query } = req;
    const { user } = req.locals;
    const messagings = await Messaging.list({
      condition: `messaging_user_id=${user.user_id}`,
      sortBy: query.sort_by || "messaging_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json(messagings);
  } catch (error) {
    return next(error)
  }
}