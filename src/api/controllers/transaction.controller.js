const httpStatus = require("http-status");
const { checkDuplicateTransaction, saveTransaction } = require("../models/transaction.model");
const { transferAsset, convertToPlanks, getTransactionDetails } = require("../services/chainProvider");
const { getWalletMnemonic } = require("../models/wallet.model") 

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
    const senderAddress = req.body.sender_address;
    const recipientAddress = req.body.recipient_address;
    const transferAmount = convertToPlanks(req.body.amount);
    const transaction = await transferAsset({
      senderMnemonic, 
      senderAddress,
      recipientAddress, 
      amount: transferAmount
    });
    
    await saveTransaction({
      senderAddress: req.body.sender_address,
      recipientAddress: recipientAddress,
      amount: req.body.amount,
      status: transaction.success ? "s" : "f",
      blockHash: transaction.block_hash,
      txHash: transaction.transaction_hash
    });

    res.status(httpStatus.CREATED);
    return res.json(transaction);   
  } catch (error) {
    return next(checkDuplicateTransaction(error));
  }
}
  