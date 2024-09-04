const crypto = require('crypto');
const moment = require('moment-timezone');
const SQLFunctions = require('../utils/sqlFunctions');

exports.savePasswordResetToken = async (passwordResetToken) => {
    const { resetToken, userId, userEmail, expires } = passwordResetToken;

    const params = {
        tablename: "wallet_password_reset_token",
        columns: ['password_reset_token', 'password_reset_token_user_id', 'password_reset_token_user_email', 'password_reset_token_expires'],
        newValues: [`'${resetToken}'`, `${userId}`, `'${userEmail}'`, `'${expires}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);

    if(responseCode == 0){
        return { 
            resetToken,
            userId,
            userEmail,
            expires
        }
    }

    throw new APIError({
        message: 'Creating refresh token failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
}

exports.generatePasswordResetToken = async (user) => {
    const userId = user.user_id;
    const userEmail = user.user_email;

    const resetToken = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment()
        .add(2, 'hours')
        .format('YYYY-MM-DD HH:mm:ss');

    const passwordResetTokenObject = {
        resetToken,
        userId,
        userEmail,
        expires
    }
    await this.savePasswordResetToken(passwordResetTokenObject);
    return passwordResetTokenObject;
}