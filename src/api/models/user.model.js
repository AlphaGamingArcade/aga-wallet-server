const httpStatus = require("http-status");
const SQLFunctions = require("../utils/sqlFunctions");
const APIError = require("../errors/api-error");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const { jwtSecret, jwtExpirationInterval, env } = require("../../config/vars");
const bcrypt = require('bcryptjs')

const ROLE_USER = 'u' // USER
const ROLE_ADMIN = 'a' // ADMIN

exports.generateAccessToken = (id) => {
    const payload = {
        exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
        iat: moment().unix(),
        sub: id,
    };
    return jwt.sign(payload, jwtSecret)
}

exports.getUserById = async (id) => {
    let user;
    if(id){
        const params = {
            tablename: "blockchain_user", 
            columns: ["user_id, user_email, user_name, user_services, user_role, user_picture"], 
            condition: `user_id=${id}`
        }
        user = await SQLFunctions.selectQuery(params);
    }
    if(user.data){
        return user.data
    }
    throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
    });
}

exports.saveUser = async (user) => {
    let { email, password, name, services, role, picture } = user;

    const params = {
        tablename: "blockchain_user",
        columns: ['user_email', 'user_password', 'user_name', 'user_services', 'user_role', 'user_picture'],
        newValues: [`'${email}'`, `'${password}'`, `'${name}'`, `'${services}'`, `'${role}'`, `'${picture}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);

    if(responseCode == 0 && email){
        let user;
        const params = {
            tablename: "blockchain_user", 
            columns: ["user_id, user_email, user_name, user_services, user_role"], 
            condition: `user_email='${email}'`
        }
        user = await SQLFunctions.selectQuery(params);
        
        if(user.data){
            
            return { ...user.data, token }
        }
        
        throw new APIError({
            message: 'Retrieving user failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    throw new APIError({
        message: 'Creating user failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
}

exports.passwordMatches = async (password, inputPassword) => {
    return bcrypt.compare(password, inputPassword);
}

exports.findAndGenerateToken = async (options) => {
    const { email, password, refreshObject } = options 
    if (!email) throw new APIError({ message: 'An email is required to generate a token' });
    
    let params = {
        tablename: "blockchain_user", 
        columns: ["user_id", "user_email", "user_password", "user_name", "user_role", "user_picture"], 
        condition: `user_email='${email}'`
    };
    const user = await SQLFunctions.selectQuery(params);
    const err = {
        status: httpStatus.UNAUTHORIZED,
        isPublic: true
    };

    if(password){
        if(user.data && await this.passwordMatches(password, user.data.user_password)){
            delete user.data.user_password;
            const token = this.generateAccessToken(user.data.user_id);
            return { user: user.data, accessToken: token };
        }
        err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.userEmail === email) {
        if (moment(refreshObject.expires).isBefore()) {
          err.message = 'Invalid refresh token.';
        } else {
          return { user, accessToken: user.token() };
        }
    } else {
        err.message = 'Incorrect email or refreshToken';
    }

    throw new APIError(err);
}

exports.checkDuplicateUser = (error) =>{
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
        return new APIError({
            message: 'Account already exist',
            status: httpStatus.CONFLICT,
            isPublic: true
          });
    }
    return error;
}


exports.ROLE_ADMIN = ROLE_ADMIN
exports.ROLE_USER = ROLE_USER