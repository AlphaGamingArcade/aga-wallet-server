const sql = require("mssql/msnodesqlv8");
const logger = require("../config/logger");
const { connectionString } = require("./vars");

var config = { driver: "msnodesqlv8", connectionString: connectionString };

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

const connectDb = async () => {
  try {
    await poolConnect;
    return poolConnect;
  } catch (error) {
    logger.error(`SPACE STORY ERROR BETTING: ${error}`);
    return err;
  }
};

module.exports = connectDb
