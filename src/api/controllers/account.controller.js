const httpStatus = require("http-status");
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { env } = require("../../config/vars");
const bcrypt = require("bcryptjs");
const { getWalletsBalance, getAccountBalance } = require("../services/chains/agaProvider");
const { DEFAULT_QUERY_OFFSET, DEFAULT_QUERY_LIMIT } = require("../utils/constants");

const Account = require("../models/account.model");
const { decryptMnemonic, encryptMnemonic } = require("../utils/hasher");

/**
 * Load wallet and append to req.locals.
 * @public
*/
exports.load = async (req, res, next, address) => {
  try {
    const account = await Account.getByAddress(address);
    const data = await getAccountBalance(address);
    req.locals = { account, ...data };
    return next();
  } catch (error) {
    return next(error);
  }
};
  
/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.account);

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const keyring = new Keyring({ type: 'sr25519' });
    let mnemonic = mnemonicGenerate();
    const pair = keyring.createFromUri(mnemonic);

    let password = req.body.account_password
    const rounds = env === 'test' ? 1 : 10;
    const hashPassword = await bcrypt.hash(password, rounds);
    const hashMnemonic = encryptMnemonic(mnemonic, password);

    mnemonic = hashMnemonic;
    password = hashPassword;

    const result = await Account.save({
      userId, 
      code: req.body.account_code, 
      address: pair.address,
      mnemonic, 
      password,
      status: 'a', 
    });

    res.status(httpStatus.CREATED);
    return res.json(result);   
  } catch (error) {
    return next(Account.checkDuplicate(error));
  }
}

/** 
 * Get user wallets in list
 */
exports.listUserAccounts = async (req, res, next) => {
  try {
    const { query } = req
    const { user } = req.locals;
    const result = await Account.list({ 
      condition: `account_user_id=${user.user_id}`,
      sortBy: query.sort_by || "account_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    const accountAddress = result.accounts.map(account => account.account_address)
    const accounts = await getWalletsBalance(accountAddress);
    res.status(httpStatus.OK);
    return res.json({ accounts, metadata: result.metadata });
  } catch (error) {
    next(error);
  }
}