const httpStatus = require("http-status");
const { saveWallet, STATUS_ACTIVE, checkDuplicateWallet, getWalletByAddress } = require("../models/wallet.model");
const { getUserById } = require("../models/user.model");
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate } = require('@polkadot/util-crypto');

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, address) => {
  try {
    const wallet = await getWalletByAddress(address);
    req.locals = { wallet };
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
    const user = await getUserById(req.body.user_id);
    const keyring = new Keyring();
    const mnemonic = mnemonicGenerate();
    const pair = keyring.createFromUri(mnemonic);

    const wallet = await saveWallet({
      userId: user.user_id, 
      walletAccount: req.body.account_id, 
      walletAlias: "", 
      walletStatus: STATUS_ACTIVE, 
      walletMnemonic: mnemonic, 
      walletPassword: req.body.password,
      walletAddress: pair.address
    });

    res.status(httpStatus.CREATED);
    return res.json({ wallet });   
  } catch (error) {
    return next(checkDuplicateWallet(error));
  }
}
  