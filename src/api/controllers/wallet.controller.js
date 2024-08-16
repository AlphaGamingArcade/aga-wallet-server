const httpStatus = require("http-status");
const { findUserById } = require("../models/user.model");
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { env } = require("../../config/vars");
const bcrypt = require("bcryptjs");
const { getWalletBalance } = require("../services/chainProvider");
const { DEFAULT_QUERY_OFFSET, DEFAULT_QUERY_LIMIT } = require("../utils/constants");

const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, address) => {
  try {
    const wallet = await Wallet.getByAddress(address);
    const data = await getWalletBalance(address);
    req.locals = { wallet: { ...wallet, ...data } };
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
exports.create = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.user_id);
    const keyring = new Keyring({ type: 'sr25519' });
    const mnemonic = mnemonicGenerate();
    const pair = keyring.createFromUri(mnemonic);

    let password = req.body.password
    const rounds = env === 'test' ? 1 : 10;
    const hash = await bcrypt.hash(password, rounds);
    password = hash;

    const wallet = await Wallet.save({
      userId: user.user_id, 
      walletAccount: req.body.account_id, 
      walletAlias: "", 
      walletStatus: Wallet.STATUS_ACTIVE, 
      walletMnemonic: mnemonic, 
      walletPassword: password,
      walletAddress: pair.address
    });

    res.status(httpStatus.CREATED);
    return res.json({ wallet });   
  } catch (error) {
    return next(Wallet.checkDuplicate(error));
  }
}

/**
 * Get wallet transactions
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const { wallet } = req.locals;
    const transactions =  await Transaction.getBySenderAddr({ 
      address: wallet.wallet_address,
      limit: req.query.limit || DEFAULT_QUERY_LIMIT,
      offset: req.query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json(transactions)
  } catch (error) {
    return next(error)
  }
}