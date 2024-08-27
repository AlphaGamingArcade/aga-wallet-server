const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

class Messaging {
  static async list(options){
      const { limit, offset, condition = "1=1", sortBy = "messaging_id", orderBy = "asc" } = options;
      
      const params = {
          tablename: "blockchain_messaging", 
          columns: ["messaging_id", "messaging_user_id", "messaging_token", "messaging_status", "messaging_created_at", "messaging_updated_at"], 
          condition,
          sortBy,
          orderBy,
          limit,
          offset
      };

      const countParams = {
          tablename: "blockchain_messaging", // Changed to the correct table name
          columns: ["COUNT(*) AS total"], 
          condition: condition
      };

      try {
          const result = await Promise.all([
              SQLFunctions.selectQuery(countParams),
              SQLFunctions.selectQueryMultiple(params),
          ]);

          const totalCount = result[0]?.data?.total || 0;
          const messagings = result[1]?.data || [];

          return {
              messagings,
              metadata: { count: totalCount }
          };
      } catch (error) {
          console.log(error)
          const err = {
              message: "Error retrieving messaging",
              status: httpStatus.INTERNAL_SERVER_ERROR
          };
          throw new APIError(err);
      }
  }
  static async getById(id) {
    let messaging;
    if (id) {
      const params = {
        tablename: "blockchain_messaging",
        columns: ["messaging_id", "messaging_user_id", "messaging_token", "messaging_status", "messaging_created_at", "messaging_updated_at"],
        condition: `messaging_id=${id}`
      };
      messaging = await SQLFunctions.selectQuery(params);
    }

    if (messaging?.data) {
      return messaging.data;
    }

    throw new APIError({
      message: 'Messaging does not exist',
      status: httpStatus.NOT_FOUND,
    });
  }
}

module.exports = Messaging;
