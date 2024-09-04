const httpStatus = require("http-status");
const SQLFunctions = require("../utils/sqlFunctions");
const APIError = require("../errors/api-error");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const { jwtSecret, jwtExpirationInterval, env } = require("../../config/vars");
const bcrypt = require('bcryptjs');
const { v4 } = require("uuid");

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

exports.findUserById = async (id) => {
    let user;
    if(id){
        const params = {
            tablename: "wallet_user", 
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

exports.findUserByEmail = async (email) => {
    let user;
    if(email){
        const params = {
            tablename: "wallet_user", 
            columns: ["user_id, user_email, user_name, user_services, user_role, user_picture"], 
            condition: `user_email='${email}'`
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
        tablename: "wallet_user",
        columns: ['user_email', 'user_password', 'user_name', 'user_services', 'user_role', 'user_picture'],
        newValues: [`'${email}'`, `'${password}'`, `'${name}'`, `'${services}'`, `'${role}'`, `'${picture}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);

    if(responseCode == 0 && email){
        let user;
        const params = {
            tablename: "wallet_user", 
            columns: ["user_id, user_email, user_name, user_services, user_role"], 
            condition: `user_email='${email}'`
        }
        user = await SQLFunctions.selectQuery(params);
        
        if(user.data){
            delete user.data.user_password;
            const token = this.generateAccessToken(user.data.user_id);
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

exports.passwordMatches = async (inputPassword, password) => {
    return bcrypt.compare(inputPassword, password);
}

exports.findAndGenerateToken = async (options) => {
    const { email, password, refreshObject } = options 
    if (!email) throw new APIError({ message: 'An email is required to generate a token' });

    let params = {
        tablename: "wallet_user", 
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
    } else if (refreshObject && refreshObject.token_user_email === email) {
        if (moment(refreshObject.expires).isBefore()) {
          err.message = 'Invalid refresh token.';
        } else {
          const token = this.generateAccessToken(user.data.user_id);
          return { user: user.data, accessToken: token };
        }
    } else {
        err.message = 'Incorrect email or refreshToken';
    }

    throw new APIError(err);
}

exports.oAuthLogin = async ({
    service, id, email, name, picture,
  }) => {
    const params = {
        tablename: "wallet_user", 
        columns: ["user_id, user_email, user_name, user_services, user_role, user_picture"], 
        condition: `user_email='${email}'`
    }
    const user = await SQLFunctions.selectQuery(params);

    if (user.data) {
      const parsedUserServices = JSON.parse(user.data.user_services) 
      parsedUserServices[service] = id;
      if (!user.data.user_name) user.data.user_name = name;
      if (!user.data.user_picture) user.data.user_picture = picture;

      const params = {
        tablename: "wallet_user",
        newValues: [`user_name='${name}'`,`user_services='${JSON.stringify(parsedUserServices)}'`, `user_picture='${picture}'`],
        condition: `user_email='${email}'`
      }

      const { responseCode } = await SQLFunctions.updateQuery(params);

      if(responseCode == 0 ){
        let user;
        const params = {
            tablename: "wallet_user", 
            columns: ["user_id, user_email, user_name, user_services, user_role"], 
            condition: `user_email='${email}'`
        }
        user = await SQLFunctions.selectQuery(params);
        
        if(user.data){
            const parsedUserServices = JSON.parse(user.data.user_services) 
            user.data.user_services = parsedUserServices 
            return { ...user.data }
        }
        
        throw new APIError({
            message: 'Retrieving user failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
      }
      
      throw new APIError({
        message: 'Updating user failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    const password = v4();
    const params2 = {
        tablename: "wallet_user",
        columns: ["user_email, user_password, user_name, user_services, user_role, user_picture"],
        newValues: [`'${email}'`, `'${password}'`,`'${name}'`, `'${JSON.stringify({[service]: id})}'`,`'${ROLE_USER}'`, `'${picture}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params2);
        
    if(responseCode == 0){
        let user;
        const params = {
            tablename: "wallet_user", 
            columns: ["user_id, user_email, user_name, user_services, user_role"], 
            condition: `user_email='${email}'`
        }
        user = await SQLFunctions.selectQuery(params);
        
        if(user.data){
            return { ...user.data }
        }
        
        throw new APIError({
            message: 'Retrieving user failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    throw new APIError({
        message: 'Creating transaction failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
  },

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
