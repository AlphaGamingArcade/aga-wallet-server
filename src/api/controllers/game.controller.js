const httpStatus = require("http-status");
const { getGameById, getGames } = require("../models/game.model");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");
const Game = require("../models/game.model");

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
 * Get All Games
 */
exports.list = async (req, res, next) => {
  try {
    const { query } = req

    const genreCondition = query.genre ? `AND game_genre='${query.genre}'` : '';
    const games = await Game.list({
      condition: `1=1 ${genreCondition}`,
      sortBy: query.sort_by || "game_id", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET,
    });
    res.status(httpStatus.OK);
    return res.json(games);
  } catch (error) {
    return next(error)
  }
}

/**
 * Get All Assets
 */
exports.listGenres = async (req, res, next) => {
  try {
    const { query } = req
    const games = await Game.listGenres({
      condition: `1=1`,
      sortBy: query.sort_by || "game_genre", 
      orderBy: query.order_by || "asc",
      limit: query.limit || DEFAULT_QUERY_LIMIT,
      offset: query.offset || DEFAULT_QUERY_OFFSET,
    });
    
    // Overwrite the genres property with just the genre names
    games.genres = games.genres.map(genre => genre.game_genre);
    
    res.status(httpStatus.OK);
    return res.json(games);
  } catch (error) {
    return next(error)
  }
}