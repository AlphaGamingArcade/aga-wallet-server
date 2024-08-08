const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions")

exports.getAssetById = async (id) => {
    let asset;
    if(id){
        const params = {
            tablename: "blockchain_asset", 
            columns: ["asset_id", "asset_name", "asset_network", "asset_symbol",], 
            condition: `asset_id='${id}'`
        }
        asset = await SQLFunctions.selectQuery(params);
    }

    if(asset.data){
        return asset.data
    }

    throw new APIError({
        message: 'Asset does not exist',
        status: httpStatus.NOT_FOUND,
    });
}

exports.getAssets = async (options) => {
    const { limit, offset, orderBy = "asset_id" } = options;
    let assets, totalCount;
    const err = { message: 'Error retrieving assets' }
    
    const countParams = {
        tablename: "blockchain_asset", 
        columns: ["COUNT(*) AS total"], 
        condition: `1`
    };

    const params = {
        tablename: "blockchain_asset", 
        columns: ["asset_id", "asset_name", "asset_network", "asset_symbol"], 
        condition: `1`,
        limit, 
        offset, 
        orderBy
    }

    const result = await Promise.all([
        SQLFunctions.selectQuery(countParams),
        SQLFunctions.selectQueryMultiple(params)
    ])

    totalCount = result[0]
    assets = result[1]

    if(assets.data && totalCount.data){
        if(assets.data.length > 0){
            return {
                assets: assets.data,
                metadata: { count: totalCount.data.total }
            }
        }
        err.message = "No assets found"
        err.status = httpStatus.NOT_FOUND
    } else {
        err.httpStatus = httpStatus.BAD_REQUEST
    }

    throw new APIError(err);
}