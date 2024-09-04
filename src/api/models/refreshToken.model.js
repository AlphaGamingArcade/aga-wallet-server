const crypto = require('crypto');
const moment = require('moment-timezone');
const SQLFunctions = require('../utils/sqlFunctions');
const APIError = require('../errors/api-error');
const httpStatus = require('http-status');

exports.findRefreshTokenByEmailAndRemove = async (email) => {
    const params = {
        tablename: "wallet_token", 
        condition: `token_user_email = '${email}'`
    }

    const { responseCode } = await SQLFunctions.deleteQuery(params);

    if(responseCode == 0){
        return { message: "Success"}
    }
    
    throw new APIError({
        message: 'Failed removing tokens',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
}

exports.findRefreshTokenByEmailAndToken = async ({ email, token }) => {
    let refreshToken;
    if(email && token){
        const params = {
            tablename: "wallet_token",
            columns: ["token_id", "token_user_id", "token", "token_user_email", "token_expires"],
            condition: `token_user_email='${email}' AND token='${token}'`
        }
        refreshToken = await SQLFunctions.selectQuery(params);
    }
    if(refreshToken.data){
        return refreshToken.data
    }
    throw new APIError({
        message: 'Invalid refresh token',
        status: httpStatus.NOT_FOUND,
    });
}

exports.findRefreshTokenAndRemove = async ({ userEmail, refreshToken }) => {
    const token = await this.findRefreshTokenByEmailAndToken({ email: userEmail, token: refreshToken });
    const params = {
        tablename: "wallet_token", 
        condition: `token_user_email = '${token.token_user_email}' AND token='${token.token}'`
    }
    const { responseCode } = await SQLFunctions.deleteQuery(params);
    if(responseCode == 0){
        return { ...token }
    }
    throw new APIError({
        message: 'Failed removing tokens',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
} 

exports.saveRefreshToken = async (refreshToken) => {
    const { token, userId, userEmail, expires } = refreshToken;

    const params = {
        tablename: "wallet_token",
        columns: ['token', 'token_user_id', 'token_user_email', 'token_expires'],
        newValues: [`'${token}'`, `${userId}`, `'${userEmail}'`, `'${expires}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);

    if(responseCode == 0){
        return { 
            token,
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

exports.generateRefreshToken = async (user) => {
    const userId = user.user_id;
    const userEmail = user.user_email;

    await this.findRefreshTokenByEmailAndRemove(userEmail);

    const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment().add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
    const refreshToken = await this.saveRefreshToken({
        token,
        userId,
        userEmail,
        expires
    });

    return refreshToken.token
}