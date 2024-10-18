const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

class Network {
    static async save(network) {
        const { networkName, networkNativeTokenSymbol, networkRpcUrl, networkType } = network;
        console.log(network)
        const params = {
            tablename: 'wallet_network',
            columns: ['network_name','network_native_token_symbol', 'network_rpc_url', 'network_type'],
            newValues: [`'${networkName}'`, `'${networkNativeTokenSymbol}'`,`'${networkRpcUrl}'`, `'${networkType}'`]
        };
        const { responseCode } = await SQLFunctions.insertQuery(params);
        
        if (responseCode === 0) {
            return { message: "Network added successfully" };
        }
    
        throw new APIError({
            message: 'Creating network failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "network_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "wallet_network", 
            columns: ["network_id", "network_name", "network_native_token_symbol", "network_rpx_url", "network_type"], 
            condition,
            sortBy,
            orderBy,
            limit,
            offset
        };

        const countParams = {
            tablename: "wallet_network", // Changed to the correct table name
            columns: ["COUNT(*) AS total"], 
            condition: condition
        };

        try {
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params),
            ]);

            const totalCount = result[0]?.data?.total || 0;
            const networks = result[1]?.data || [];

            return {
                networks,
                metadata: { count: totalCount }
            };
        } catch (error) {
            console.log(error)
            const err = {
                message: "Error retrieving networks",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
    }
    static async getById(id) {
        let network;
        if (id) {
        const params = {
            tablename: "wallet_network",
            columns: ["network_id", "network_name", "network_native_token_symbol", "network_rpx_url", "network_type"],
            condition: `network_id=${id}`
        };
        network = await SQLFunctions.selectQuery(params);
        }

        if (network?.data) {
        return network.data;
        }

        throw new APIError({
        message: 'Network does not exist',
        status: httpStatus.NOT_FOUND,
        });
    }

    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "network_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "wallet_network", 
            columns: ["network_id", "network_name", "network_native_token_symbol", "network_rpc_url", "network_type"], 
            condition,
            sortBy,
            orderBy,
            limit,
            offset
        };
  
        const countParams = {
            tablename: "wallet_network", // Changed to the correct table name
            columns: ["COUNT(*) AS total"], 
            condition: condition
        };
  
        try {
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params),
            ]);
  
            const totalCount = result[0]?.data?.total || 0;
            const networks = result[1]?.data || [];
  
            return {
                networks,
                metadata: { count: totalCount }
            };
        } catch (error) {
            console.log(error)
            const err = {
                message: "Error retrieving networks",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
    }

    static checkDuplicateNetwork = (error) =>{
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            return new APIError({
                message: 'Network already exist',
                status: httpStatus.CONFLICT,
                isPublic: true
            });
        }
        return error;
    }
  
}

module.exports = Network;
