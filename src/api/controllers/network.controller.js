const httpStatus = require("http-status");
const agaProvider = require("./../services/chains/agaProvider");
const Network = require("../models/network.model");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");

exports.load = async (req, res, next, networkId) => {
    try {
      const network = await Network.getById(networkId);
      req.locals = { network };
      return next();
    } catch (error) {
      return next(error);
    }
};

/**
 * Get network
 * @public
 */
exports.get = (req, res) => res.json(req.locals.network);

/**
 * create network
 * @public
 */
exports.create = async (req, res, next) => {
    try {
        const networkName = req.body.network_name;
        const networkNativeTokenSymbol = req.body.network_native_token_symbol;
        const networkRpcUrl = req.body.network_rpc_url;
        const networkType = req.body.network_type;

        const network = await Network.save({
            networkName,
            networkNativeTokenSymbol,
            networkRpcUrl,
            networkType
        });

        res.status(httpStatus.OK);
        return res.json(network);
    } catch (error) {
        return next(Network.checkDuplicateNetwork(error))
    }
};

exports.list = async (req, res, next) => {
    try {
        const { query } = req
        const networks = await Network.list({
            condition: "1=1",
            sortBy: query.sort_by || "network_id", 
            orderBy: query.order_by || "asc",
            limit: query.limit || DEFAULT_QUERY_LIMIT,
            offset: query.offset || DEFAULT_QUERY_OFFSET
        });
        
        res.status(httpStatus.OK);
        return res.json(networks);   
    } catch (error) {
        return next(error)
    }
}