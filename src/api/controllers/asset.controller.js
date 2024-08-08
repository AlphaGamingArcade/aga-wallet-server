/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, address) => {
    try {
      const wallet = await getWalletByAddress(address);
      const data = await getWalletBalance(address);
      req.locals = { wallet: { ...wallet, ...data } };
      return next();
    } catch (error) {
      return next(error);
    }
  };