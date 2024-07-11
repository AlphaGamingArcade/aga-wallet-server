const httpStatus = require("http-status");
const { checkDuplicateTransaction, getTransactionById } = require("../models/transaction.model");

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, address) => {
  try {
    const wallet = await getTransactionById(address);
    req.locals = { wallet };
    return next();
  } catch (error) {
    return next(error);
  }
};
  
/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.wallet);

  /**
 * Returns jwt token if registration was successful
 * @public
 */
exports.send = async (req, res, next) => {
  try {
    res.status(httpStatus.CREATED);
    return res.json({ wallet });   
  } catch (error) {
    return next(checkDuplicateTransaction(error));
  }
}
  