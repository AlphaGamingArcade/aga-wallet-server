const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

exports.saveQrSessionToken = async (options) => {
    const { token, expires } = options;

    const params = {
        tablename: "wallet_qr_sessions",
        columns: ['qr_session_user_id', 'qr_session_token', 'qr_session_status', 'qr_session_expires_at'],
        newValues: [`null`, `'${token}'`, `'p'`, `'${expires}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);

    if(responseCode == 0){
        return { 
            token,
            expires
        }
    }

    throw new APIError({
        message: 'Creating refresh token failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
}

exports.approveQrSession = async (options) => {
    const { token, userId } = options;

    const params = {
        tablename: "wallet_qr_sessions",
        newValues: [
            `qr_session_user_id='${userId}'`
        ],
        condition: `qr_session_token='${token}'`
    };

    const { responseCode, updatedRecord } = await SQLFunctions.updateQuery(params);

    if (responseCode === 0) {
        return updatedRecord;
    }
    
    throw new APIError({
        message: 'Failed updating qr session',
        status: httpStatus.INTERNAL_SERVER_ERROR
    });
}
