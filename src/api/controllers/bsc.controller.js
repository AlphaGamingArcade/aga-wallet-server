const httpStatus = require("http-status");
const bscProvider = require("../services/chains/bscProvider");
const Account = require("../models/account.model");
const { Wallet } = require("ethers");

exports.get = async (req, res) => {
    res.send("BSC")
}

exports.getAddress = async (req, res, next) => {    
    try {
        const accountCode = req.body.account_code;
        const accountPassword = req.body.account_password;
        const account = await Account.getByAccountCode(
            accountCode, 
            ['account_mnemonic', 'account_password']
        )
        const mnemonic = await Account.decryptMnemonic(account, accountPassword);

        const ethPair = Wallet.fromPhrase(mnemonic);
        res.send(ethPair.address);
    } catch (error) {
        next(error);
    }
}

exports.listAssets = async (_req, res, next) => {
    try {
        // Assets
        const listAssets = await bscProvider.listAssets();
        assets = { assets: listAssets.assets}
        res.status(httpStatus.OK);
        return res.json(assets);   
    } catch (error) {
        return next(error)
    }
}

exports.accountListAssets = async (req, res, next) => {
    try {
        const address = req.params.address;

        const nativeAssets = await bscProvider.getAccountNativeTokenBalance(address);

        console.log("Account assets", nativeAssets)

        res.status(httpStatus.OK);
        return res.json({})
    } catch (error) {
        return next(error)
    }
}