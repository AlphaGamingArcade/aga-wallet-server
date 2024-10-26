const httpStatus = require("http-status");
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { env } = require("../../config/vars");
const bcrypt = require("bcryptjs");
const { getAccountsBalance, getAccountBalance } = require("../services/chains/agaProvider");
const { DEFAULT_QUERY_OFFSET, DEFAULT_QUERY_LIMIT } = require("../utils/constants");

const Account = require("../models/account.model");
const { encryptMnemonic } = require("../utils/hasher");

/**
 * Load wallet and append to req.locals.
 * @public
*/
exports.load = async (req, res, next, address) => {
  try {
    const account = await Account.getByAddress(address);
    const data = await getAccountBalance(address);
    req.locals = { account: { ...account, account_assets: [ data ] }};
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
    let password = req.body.account_password;
    const accountCode = req.body.account_code;

    let mnemonic = mnemonicGenerate();
    
    const hashMnemonic = encryptMnemonic(mnemonic, password);
    mnemonic = hashMnemonic;

    const rounds = env === 'test' ? 1 : 10;
    const hashPassword = await bcrypt.hash(password, rounds);
    password = hashPassword;

    const result = await Account.save({
      userId, 
      accountCode, 
      status: "a", 
      mnemonic, 
      password
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

    console.log(result)

    res.status(httpStatus.OK);
    return res.json({ accounts: result.accounts, metadata: result.metadata });
  } catch (error) {
    next(error);
  }
}