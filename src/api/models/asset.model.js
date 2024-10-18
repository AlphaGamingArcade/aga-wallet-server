const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

class Asset {
    static async save(options){
        const { networkId, name, symbol, native = 'y', contract = '' } = options;
        const params = {
            tablename: 'wallet_asset',
            columns: ['asset_network_id', 'asset_name', 'asset_symbol', 'asset_native', 'asset_contract'],
            newValues: [`'${networkId}'`, `'${name}'`, `'${symbol}'`, `'${native}'`,`'${contract}'`], 
        };
        const { responseCode } = await SQLFunctions.insertQuery(params);
        
        if (responseCode === 0) {
            return { messag: 'Asset registered succesfully'};
        }
    
        throw new APIError({
            message: 'Registering asset failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "asset_id", orderBy = "asc" } = options;

        const params = {
            tablename: "wallet_asset", 
            columns:[
                "wallet_asset.asset_id", 
                "wallet_asset.asset_network_id",
                "wallet_network.network_name as asset_network_name", 
                "wallet_asset.asset_name", 
                "wallet_asset.asset_symbol", 
                "wallet_asset.asset_decimals", 
                "wallet_asset.asset_native", 
                "asset_contract", 
            ],
            leftJoin: "wallet_network ON wallet_asset.asset_network_id = wallet_network.network_id", 
            condition,
            sortBy,
            orderBy,
            limit,
            offset
        };

        const countParams = {
            tablename: "wallet_asset", // Changed to the correct table name
            columns: ["COUNT(*) AS total"], 
            condition: condition
        };

        try {
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectLeftJoinQuery(params),
            ]);

            const totalCount = result[0]?.data?.total || 0;
            const assets = result[1]?.data || [];

            return {
                assets: assets,
                metadata: { count: totalCount }
            };
        } catch (error) {
            console.log(error)
            const err = {
                message: "Error retrieving assets",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
    }

    static async getById(id) {
        let asset;
        if (id) {
            const params = {
                tablename: "wallet_asset", 
                columns: ["asset_id", "asset_network_id", "asset_name", "asset_native", "asset_contract"], 
                condition: `asset_id=${id}`
            };
            asset = await SQLFunctions.selectQuery(params);
        }

        if (asset?.data) {
            return asset.data;
        }

        throw new APIError({
            message: 'Asset does not exist',
            status: httpStatus.NOT_FOUND,
        });
    }

    static async getAssets(options) {
        const { limit, offset, sortBy = "asset_id", orderBy = "asc" } = options;
        let assets, totalCount;
        const err = { message: 'Error retrieving assets' };

        const countParams = {
            tablename: "wallet_asset", 
            columns: ["COUNT(*) AS total"], 
            condition: `1=1`
        };

        const params = {
            tablename: "wallet_asset", 
            columns: ["asset_id", "asset_network_id", "asset_name", "asset_native", "asset_contract"], 
            condition: `1=1`,
            limit, 
            offset, 
            sortBy,
            orderBy
        };

        const result = await Promise.all([
            SQLFunctions.selectQuery(countParams),
            SQLFunctions.selectQueryMultiple(params)
        ]);

        totalCount = result[0];
        assets = result[1];

        if (assets?.data && totalCount?.data) {
            if (assets.data.length > 0) {
                return {
                    assets: assets.data,
                    metadata: { count: totalCount.data.total }
                };
            }
            err.message = "No assets found";
            err.status = httpStatus.NOT_FOUND;
        } else {
            err.httpStatus = httpStatus.BAD_REQUEST;
        }

        throw new APIError(err);
    }

    static checkDuplicate(error) {
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            return new APIError({
                message: 'Asset already exists',
                status: httpStatus.CONFLICT,
                isPublic: true,
            });
        }
        return error;
    }
}

module.exports = Asset;
