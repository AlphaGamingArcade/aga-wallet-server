const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions")

exports.getGameById = async (id) => {
    let asset;
    if(id){
        const params = {
            tablename: "blockchain_game", 
            columns: ["game_id", "game_name", "game_image", "game_url", "game_status", "game_players", "game_created_at", "game_updated_at"], 
            condition: `game_id=${id}`
        }
        asset = await SQLFunctions.selectQuery(params);
    }

    if(asset.data){
        return asset.data
    }

    throw new APIError({
        message: 'Game does not exist',
        status: httpStatus.NOT_FOUND,
    });
}

exports.getGames = async (options) => {
    const { limit, offset, sortBy = "game_id", orderBy = "asc" } = options;
    let games, totalCount, genres;
    const err = { message: 'Error retrieving games' }

    const distinctParams = {
        tablename: "blockchain_game",
        columns: ["game_genre"],
        condition: `1=1`
    }

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
    }

    const result = await Promise.all([
        SQLFunctions.selectDistinctQuery(distinctParams),
        SQLFunctions.selectQuery(countParams),
        SQLFunctions.selectQueryMultiple(params)
    ])


    genres = result[0]
    totalCount = result[1]
    games = result[2]

    if(games.data && totalCount.data && genres.data){
        if(games.data.length > 0){
            return {
                games: games.data,
                metadata: { count: totalCount.data.total, genres: genres.data }
            }
        }
        err.message = "No games found"
        err.status = httpStatus.NOT_FOUND
    } else {
        err.httpStatus = httpStatus.BAD_REQUEST
    }

    throw new APIError(err);
}