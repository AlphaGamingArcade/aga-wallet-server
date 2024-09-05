const httpStatus = require("http-status");
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { env } = require("../../config/vars");
const bcrypt = require("bcryptjs");
const { getAccountBalance, getAccountsBalance } = require("../services/chains/agaProvider");
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
    const data = await getAccountBalance(address);
    req.locals = { wallet, ...data };
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
    const userId = req.user.user_id;
    const keyring = new Keyring({ type: 'sr25519' });
    const mnemonic = mnemonicGenerate();
    const pair = keyring.createFromUri(mnemonic);

    let password = req.body.password
    const rounds = env === 'test' ? 1 : 10;
    const hash = await bcrypt.hash(password, rounds);
    password = hash;

    const wallet = await Wallet.save({
      userId, 
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
 * Get user wallets in list
 */
exports.listUserWallets = async (req, res, next) => {
  try {
    const { query } = req
    const { user } = req.locals;
    const result = await Wallet.list({ 
      condition: `wallet_user_id=${user.user_id}`,
      sortBy: query.sort_by || "wallet_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    const walletsAddrs = result.wallets.map(wallet => wallet.wallet_address)
    const walletsData = await getAccountsBalance(walletsAddrs);
    res.status(httpStatus.OK);
    return res.json({ wallets: walletsData, metadata: result.metadata });
  } catch (error) {
    next(error);
  }
}