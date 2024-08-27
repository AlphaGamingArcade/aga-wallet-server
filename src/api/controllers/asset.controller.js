const httpStatus = require("http-status");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");

const Asset = require("../models/asset.model");

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, assetId) => {
    try {
      const asset = await  Asset.getById(assetId);
      req.locals = { asset };
      return next();
    } catch (error) {
      return next(error);
    }
};

/**
 * Get asset
 * @public
 */
exports.get = (req, res) => res.json(req.locals.asset);

/**
 * Get list of assets
 */
exports.list = async (req, res, next) => {
  try {
    const { query } = req
    const assets = await Asset.list({
      condition: `1=1`,
      sortBy: query.sort_by || "asset_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET
    });
    
    res.status(httpStatus.OK);
    return res.json({ ...assets });
  } catch (error) {
    return next(error)
  }
}