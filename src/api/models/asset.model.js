const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

class Asset {
    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "asset_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "wallet_asset", 
            columns: ["asset_id", "asset_name", "asset_network", "asset_symbol", "asset_icon"], 
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
                SQLFunctions.selectQueryMultiple(params),
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
                columns: ["asset_id", "asset_name", "asset_network", "asset_symbol", "asset_icon"], 
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
            columns: ["asset_id", "asset_name", "asset_network", "asset_symbol", "asset_icon"], 
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
}

module.exports = Asset;
