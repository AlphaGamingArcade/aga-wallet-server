const httpStatus = require("http-status");
const { checkDuplicateTransaction } = require("../models/transaction.model");
const { transferAsset, convertToPlanks, getTransactionDetails } = require("../services/chainprovider");
const { getUserWallet } = require("../models/wallet.model") 

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
    const walletData = {
      senderAddress: req.body.sender_address,
      password: req.body.password,
      userId: req.user.user_id 
    }
    const wallet = await getUserWallet(walletData);
    const senderMnemonic = "champion label silly fortune response more post catch great profit city moment";
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
  