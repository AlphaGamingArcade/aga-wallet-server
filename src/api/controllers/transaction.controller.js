const httpStatus = require("http-status");
const { transferAsset, convertToPlanks, getTransactionDetails } = require("../services/chainProvider");

const Transaction = require("../models/transaction.model")
const Wallet = require("../models/wallet.model"); 
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");

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
    const senderMnemonic = await Wallet.getWalletMnemonic({
      walletAddress: req.body.sender_address,
      password: req.body.password,
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
    
    await Transaction.save({
      senderAddress: req.body.sender_address,
      recipientAddress: recipientAddress,
      amount: req.body.amount,
      status: transaction.success ? Transaction.STATUS_SUCCESS : Transaction.STATUS_FAILED,
      blockHash: transaction.block_hash,
      txHash: transaction.transaction_hash
    });

    res.status(httpStatus.CREATED);
    return res.json(transaction);   
  } catch (error) {
    return next(Transaction.checkDuplicate(error));
  }
}

/**
 * Get transactions transactions
 */
exports.list = async (req, res, next) => {
  try {
    const { query } = req
    const { wallet } = req.locals;

    const transactions = await Transaction.list({ 
      condition: `tx_wallet_sender_address = '${wallet.wallet_address}' OR tx_wallet_recipient_address = '${wallet.wallet_address}'`,
      sortBy: query.sort_by || "tx_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });

    res.status(httpStatus.OK);
    return res.json(transactions)
  } catch (error) {
    return next(error)
  }
}