const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

class Game {
  static async list(options){
      const { limit, offset, condition = "1=1", sortBy = "game_id", orderBy = "asc" } = options;
      
      const params = {
          tablename: "blockchain_game", 
          columns: ["game_id", "game_name", "game_image", "game_genre", "game_url", "game_status", "game_players", "game_created_at", "game_updated_at"], 
          condition,
          sortBy,
          orderBy,
          limit,
          offset
      };

      const countParams = {
          tablename: "blockchain_game", // Changed to the correct table name
          columns: ["COUNT(*) AS total"], 
          condition: condition
      };

      try {
          const result = await Promise.all([
              SQLFunctions.selectQuery(countParams),
              SQLFunctions.selectQueryMultiple(params),
          ]);

          const totalCount = result[0]?.data?.total || 0;
          const games = result[1]?.data || [];

          return {
              games: games,
              metadata: { count: totalCount }
          };
      } catch (error) {
          console.log(error)
          const err = {
              message: "Error retrieving games",
              status: httpStatus.INTERNAL_SERVER_ERROR
          };
          throw new APIError(err);
      }
  }
  static async listGenres(options){
    const { limit, offset, condition = "1=1", sortBy = "game_genre", orderBy = "asc" } = options;
    
    const params = {
        tablename: "blockchain_game", 
        columns: ["DISTINCT game_genre"], 
        condition,
        sortBy,
        orderBy,
        limit,
        offset
    };

    const countParams = {
        tablename: "blockchain_game",
        columns: ["COUNT(DISTINCT game_genre) AS total"], 
        condition
    };

    try {
        const result = await Promise.all([
            SQLFunctions.selectQuery(countParams),
            SQLFunctions.selectQueryMultiple(params),
        ]);

        const totalCount = result[0]?.data?.total || 0;
        const genres = result[1]?.data || [];

        return {
            genres: genres,
            metadata: { count: totalCount }
        };
    } catch (error) {
        console.log(error)
        const err = {
            message: "Error retrieving game genres",
            status: httpStatus.INTERNAL_SERVER_ERROR
        };
        throw new APIError(err);
    }
}
  static async getGameById(id) {
    let asset;
    if (id) {
      const params = {
        tablename: "blockchain_game",
        columns: ["game_id", "game_name", "game_image", "game_url", "game_status", "game_players", "game_created_at", "game_updated_at"],
        condition: `game_id=${id}`
      };
      asset = await SQLFunctions.selectQuery(params);
    }

    if (asset?.data) {
      return asset.data;
    }

    throw new APIError({
      message: 'Game does not exist',
      status: httpStatus.NOT_FOUND,
    });
  }

  static async getGames(options) {
    const { limit, offset, sortBy = "game_id", orderBy = "asc" } = options;
    const err = { message: 'Error retrieving games' };

    const distinctParams = {
      tablename: "blockchain_game",
      columns: ["game_genre"],
      condition: `1=1`
    };

    const countParams = {
      tablename: "blockchain_game",
      columns: ["COUNT(*) AS total"],
      condition: `1=1`
    };

    const params = {
      tablename: "blockchain_game",
      columns: ["game_id", "game_name", "game_image", "game_url", "game_status", "game_players", "game_created_at", "game_updated_at"],
      condition: `1=1`,
      limit,
      offset,
      sortBy,
      orderBy
    };

    const [genres, totalCount, games] = await Promise.all([
      SQLFunctions.selectDistinctQuery(distinctParams),
      SQLFunctions.selectQuery(countParams),
      SQLFunctions.selectQueryMultiple(params)
    ]);

    if (games?.data && totalCount?.data && genres?.data) {
      if (games.data.length > 0) {
        return {
          games: games.data,
          metadata: { count: totalCount.data.total, genres: genres.data }
        };
      }
      err.message = "No games found";
      err.status = httpStatus.NOT_FOUND;
    } else {
      err.status = httpStatus.BAD_REQUEST;
    }

    throw new APIError(err);
  }
}

module.exports = Game;
