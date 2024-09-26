const httpStatus = require("http-status");
const agaProvider = require("./../services/chains/agaProvider");

exports.get = async (req, res) => {
    res.send("OKAY")
}

exports.listAssets = async (_req, res) => {
    // Assets
    const rawAssets = await agaProvider.listAssets();
    let assets = rawAssets.assets.map(rawAsset => ({
        id: rawAsset.asset_id ?? null,
        icon: "",
        name: rawAsset.asset_metadata.name,
        decimals: rawAsset.asset_metadata.decimals,
        symbol: rawAsset.asset_metadata.symbol
    }))

    // Native Asset
    const nativeAsset = {
        id: null,
        icon: "",
        name: "AGA",
        decimals: "12",
        symbol: "AGA"
    }

    assets = { assets: [nativeAsset, ...assets]}
    res.status(httpStatus.OK);
    return res.json(assets);
}

exports.accountListAssets = async (req, res) => {
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
}