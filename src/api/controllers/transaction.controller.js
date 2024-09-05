const httpStatus = require("http-status");
const { convertToPlanks, getTransactionDetails, substrateTransferAsset } = require("../services/chains/agaProvider");
const Transaction = require("../models/transaction.model")
const Wallet = require("../models/wallet.model"); 
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");
const Account = require("../models/account.model");
const { decryptMnemonic } = require("../utils/hasher");

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
    const userId = req.user.user_id;
    const sourceAddress = req.params.account_address;
    const destinationAddress = req.body.destination_address;
    
    const account = await Account.getByAddress(sourceAddress, 
      ['account_mnemonic', 'account_password']
    )

    const mnemonic = await Account.decryptMnemonic(account, req.body.password);

    const transferAmount = convertToPlanks(req.body.amount);
    const transaction = await substrateTransferAsset({
      senderMnemonic: mnemonic, 
      senderAddress: sourceAddress,
      recipientAddress: destinationAddress, 
      amount: transferAmount
    });

    await Transaction.save({
      senderAddress: sourceAddress,
      recipientAddress: destinationAddress,
      amount: req.body.amount,
      status: transaction.success ? Transaction.STATUS_SUCCESS : Transaction.STATUS_FAILED,
      blockHash: transaction.block_hash,
      txHash: transaction.transaction_hash
    });

    // Send Notification
    if(transaction.success){
      if(req.messaging?.messaging_token){
        const message = {
          data: { score: '850', time: transaction.timestamp },
          notification: {
              title: `Asset received`,
              body: `Received ${req.body.amount} AGA from ${req.body.sender_address}`
          },
          token: req.messaging.messaging_token
        }
        res.cloudMessaging(message);
      }
    }

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