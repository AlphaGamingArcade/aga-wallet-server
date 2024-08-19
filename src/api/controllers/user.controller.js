const httpStatus = require('http-status');
const { omit } = require('lodash');
const { findUserById } = require('../models/user.model');
const { getWalletsBalance } = require('../services/chainProvider');
const { DEFAULT_QUERY_OFFSET, DEFAULT_QUERY_LIMIT } = require('../utils/constants');

const Wallet = require('../models/wallet.model');
const Notification = require('../models/notification.model');

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const user = await findUserById(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user);

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

    await user.updateOne(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = (req, res, next) => {
  const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
  const updatedUser = omit(req.body, ommitRole);
  const user = Object.assign(req.locals.user, updatedUser);

  user.save()
    .then((savedUser) => res.json(savedUser.transform()))
    .catch((e) => next(User.checkDuplicateEmail(e)));
};

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const users = await User.list(req.query);
    const transformedUsers = users.map((user) => user.transform());
    res.json(transformedUsers);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = (req, res, next) => {
  const { user } = req.locals;

  user.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch((e) => next(e));
};

/** 
 * Get user wallets in list
 */
exports.wallets = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const result = await Wallet.getWalletsByUserId({ 
      userId: user.user_id,
      limit: req.query.limit || DEFAULT_QUERY_LIMIT,
      offset: req.query.offset || DEFAULT_QUERY_OFFSET
    });
    const walletsAddrs = result.wallets.map(wallet => wallet.wallet_address)
    const walletsData = await getWalletsBalance(walletsAddrs);
    res.status(httpStatus.OK);
    return res.json({ wallets: walletsData, metadata: result.metadata });
  } catch (error) {
    next(error);
  }
}

exports.notifications = async (req, res, next) => {
  try {
    const { query } = req;
    const { user } = req.locals;
    const result = await Notification.list({
      condition: `notification_user_id=${user.user_id}`,
      sortBy: query.sort_by || "notification_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json({ notifications: result.notifications, metadata: result.metadata });
  } catch (error) {
    return next(error)
  }
}