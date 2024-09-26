const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

class QrRoom {
    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "qr_room_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "wallet_qr_room", 
            columns: ["qr_room_id", "qr_room_user_id", "qr_room_signed", "qr_room_token", "qr_room_client_id", "qr_room_status","qr_room_expires_at"], 
            condition,
            sortBy,
            orderBy,
            limit,
            offset
        };
    
        const countParams = {
            tablename: "wallet_qr_room", // Changed to the correct table name
            columns: ["COUNT(*) AS total"], 
            condition: condition
        };
    
        try {
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params),
            ]);
    
            const totalCount = result[0]?.data?.total || 0;
            const rooms = result[1]?.data || [];
    
            return {
                rooms: rooms,
                metadata: { count: totalCount }
            };
        } catch (error) {
            console.log(error)
            const err = {
                message: "Error retrieving rooms",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
    }

    static async saveQrRoom(options){
        const { token, expires, clientId } = options;
    
        const params = {
            tablename: "wallet_qr_room",
            columns: ['qr_room_token', 'qr_room_client_id', 'qr_room_expires_at'],
            newValues: [`'${token}'`, `'${clientId}'`, `'${expires}'`]
        }
        const { responseCode } = await SQLFunctions.insertQuery(params);
    
        if(responseCode == 0){
            return { 
                token,
                expires,
                clientId
            }
        }
    
        throw new APIError({
            message: 'Creating refresh token failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    static async remove(options){
        const { condition = "1=0" } = options;
        
        const params = {
            tablename: "wallet_qr_room", 
            condition
        };
    
        try {
            await SQLFunctions.deleteQuery(params);
            return {
                message: "Deleted successfully"
            };
        } catch (error) {
            console.log(error)
            const err = {
                message: "Error deleting rooms",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
    }

}

module.exports = QrRoom;