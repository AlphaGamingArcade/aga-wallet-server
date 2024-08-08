const httpStatus = require("http-status");
const { getNotificationById, getNotifications } = require("../models/notification.model");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, assetId) => {
    try {
      const notification = await getNotificationById(assetId);
      req.locals = { notification: { ...notification } };
      return next();
    } catch (error) {
      return next(error);
    }
};

/**
 * Get asset
 * @public
 */
exports.get = (req, res) => res.json(req.locals.notification);

/**
 * Get asset
 * @public
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await getNotifications({
      limit: req.query.limit || DEFAULT_QUERY_LIMIT,
      offset: req.query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json({ ...notifications });
  } catch (error) {
    next(error)
  }
};