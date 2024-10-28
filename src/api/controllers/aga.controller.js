const httpStatus = require("http-status");
const agaProvider = require("./../services/chains/agaProvider");
const Account = require("../models/account.model");
const { Keyring } = require('@polkadot/keyring');
const { default: Decimal } = require("decimal.js");

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

exports.getPools = async (_req, res, next) => {
    try {
        const pools = await agaProvider.getPools();
        return res.json({ pools: pools })
    } catch (error) {
        return next(error)
    }
}

exports.getQuotePriceExactTokensForTokens = async (req, res, next) => {
    try {
        const { pair, amount } = req.body;
        const [reserves, noFeeQuotePriceExactTokens, withFeeQuotePriceExactTokens] = await Promise.all([
            agaProvider.getReserves(pair),
            agaProvider.getQuotePriceExactTokensForTokens(pair, amount, false),
            agaProvider.getQuotePriceExactTokensForTokens(pair, amount, true)
        ]);

        const swapFee = new Decimal(noFeeQuotePriceExactTokens.replace(/[, ]/g, ""))
            .minus(withFeeQuotePriceExactTokens);

        const reservesBeforeSwap = [
            new Decimal(reserves[0].replace(/[, ]/g, "")).mul(1),
            new Decimal(reserves[1].replace(/[, ]/g, "")).mul(1)
        ]

        const oldRate = new Decimal(reservesBeforeSwap[0])
        .div(reservesBeforeSwap[1])

        const reservesAfterSwap = [
            new Decimal(reserves[0].replace(/[, ]/g, ""))
                .add(amount),
            new Decimal(reserves[1].replace(/[, ]/g, ""))
                .minus(withFeeQuotePriceExactTokens)
        ]

        const newRate = new Decimal(reservesAfterSwap[0])
            .div(reservesAfterSwap[1])
        
        const priceImpact = new Decimal(newRate)
            .minus(oldRate)
            .div(oldRate)
            .mul(100);

        return res.json({
            pair,
            quote_amount: withFeeQuotePriceExactTokens,
            swap_fee: swapFee,
            price_impact_in_percent: priceImpact
        })
    } catch (error) {
        return next(error)
    }
}

exports.swapExactTokensForTokens = async (req, res, next) => {
    try {
        const { pair, amount_in, amount_out_min, password } = req.body;
        const account = await Account.getByAddress(req.params.account_address, 
            ['account_mnemonic', 'account_password']
        )
        const mnemonic = await Account.decryptMnemonic(account, password);
        const result = await agaProvider.swapExactTokensForTokens(mnemonic, pair, amount_in, amount_out_min);
        return res.json(result)
    } catch (error) {
        return next(error)  
    }
}


exports.addLiquidityPool = async (req, res, next) => {
    try {
        const { amount1_desired, amount2_desired, amount1_min, amount2_min, password } = req.body;
        const account = await Account.getByAddress(req.params.account_address, 
            ['account_mnemonic', 'account_password']
        )
        const mnemonic = await Account.decryptMnemonic(account, password);

        return res.json({ message: "Add Liquidity Pool"})

    } catch (error) {
        return next(error)
    }
}