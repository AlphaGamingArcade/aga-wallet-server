const httpStatus = require("http-status");
const { checkDuplicateTransaction } = require("../models/transaction.model");
const { transferAsset, convertToPlanks, getTransactionDetails } = require("../services/chainprovider");
const { getUserWallet, getWalletMnemonic } = require("../models/wallet.model") 

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, hash) => {
  try {
    const transaction = await getTransactionDetails(hash);
    req.locals = { transaction };
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
    const senderMnemonic = await getWalletMnemonic({
      walletAddress: req.body.sender_address,
      walletPassword: req.body.password,
    });
    const recipientAddress = req.body.recipient_address;
    const transferAmount = convertToPlanks(req.body.amount);
    const transaction = await transferAsset({
      senderMnemonic, 
      recipientAddress, 
      amount: transferAmount
    });
    res.status(httpStatus.CREATED);
    return res.json(transaction);   
  } catch (error) {
    return next(checkDuplicateTransaction(error));
  }
}
  