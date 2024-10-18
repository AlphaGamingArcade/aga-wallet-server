const httpStatus = require("http-status");
const agaProvider = require("./../services/chains/agaProvider");
const Account = require("../models/account.model");
const { Keyring } = require('@polkadot/keyring');

exports.get = async (req, res) => {
    res.send("AGA")
}

exports.getAddress = async (req, res, next) => {    
    try {
        const accountCode = req.body.account_code;
        const accountPassword = req.body.account_password;
        const account = await Account.getByAccountCode(
            accountCode, 
            ['account_mnemonic', 'account_password'] // Excluded feilds
        )
        const mnemonic = await Account.decryptMnemonic(account, accountPassword);
        const keyring = new Keyring({ type: 'sr25519' });
        const substratePair = keyring.createFromUri(mnemonic);
        res.send(substratePair.address);
    } catch (error) {
        next(error);
    }
}

exports.listAssets = async (_req, res, next) => {
    try {
        // Assets
        const result = await agaProvider.listAssets();
        res.status(httpStatus.OK);
        return res.json(result);   
    } catch (error) {
        return next(error)
    }
}

exports.accountListAssets = async (req, res, next) => {
    try {
        const account = req.params.account_id;
        const tokenBalance = await agaProvider.getAccountTokensBalance(account);
        const nativeAsset = {
            id: null,
            icon: "",
            balance: tokenBalance.balance,
            decimals: tokenBalance.tokenDecimals == '' ? '12' : tokenBalance.tokenDecimals,
            symbol: tokenBalance.tokenSymbol
        }

        const tokens = tokenBalance.assets.flatMap(asset => ({
            id: asset.tokenId,
            icon: "",
            balance: asset.tokenAsset.balance,
            decimals: asset.assetTokenMetadata.decimals,
            symbol: asset.assetTokenMetadata.symbol
        }))

        const assets = { assets: [nativeAsset, ...tokens] }
        res.status(httpStatus.OK);
        return res.json(assets)
    } catch (error) {
        return next(error)
    }
}