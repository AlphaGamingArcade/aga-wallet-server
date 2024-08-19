const httpStatus = require("http-status");
const { getGameById, getGames } = require("../models/game.model");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");

/**
 * Load wallet and append to req.locals.
 * @public
 */
exports.load = async (req, res, next, gameId) => {
    try {
      const game = await getGameById(gameId);
      req.locals = { game: { ...game } };
      return next();
    } catch (error) {
      return next(error);
    }
};

/**
 * Get asset
 * @public
 */
exports.get = (req, res) => res.json(req.locals.game);

/**
 * Get All Assets
 */
exports.list = async (req, res, next) => {
  try {
    const games = await getGames({
      limit: req.query.limit || DEFAULT_QUERY_LIMIT,
      offset: req.query.offset || DEFAULT_QUERY_OFFSET
    });
    res.status(httpStatus.OK);
    return res.json({ ...games });
  } catch (error) {
    return next(error)
  }
}