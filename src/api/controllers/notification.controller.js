const httpStatus = require("http-status");
const Notification = require("../models/notification.model");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");

/**
 * Load notification and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, id) => {
    try {
      const notification = await Notification.getNotificationById(id);
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
exports.remove = async (req, res) => {
  const { notification } = req.locals;

  await Notification.delete({ id: notification.notification_id });
  
  res.status(httpStatus.OK);
  return res.json({ message: "Notification deleted" });
};

/**
 * Get asset
 * @public
 */
exports.put = async (req, res) => {
  const { notification } = req.locals;
  
 
};


/**
 * Get asset
 * @public
 */
exports.patch = async (req, res, next) => {
  try {
    const { notification } = req.locals;
    const updatedNotification = await Notification.updateStatus({
      id: notification.notification_id,
      status: req.body.status
    });

    res.status(httpStatus.OK);
    return res.json(updatedNotification);
  } catch (error) {
    next(error)
  }
};

/**
 * Gets all notifications
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const { query } = req
    const notifications = await Notification.list({
      condition: "1=1",
      sortBy: query.sort_by || "notification_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json({ ...notifications });
  } catch (error) {
    next(error)
  }
};