const httpStatus = require('http-status');
const moment = require('moment-timezone');
const { jwtExpirationInterval, env } = require('../../config/vars');
const APIError = require('../errors/api-error');
const emailProvider = require('../services/emails/emailProvider');
const { saveUser, ROLE_USER, checkDuplicateUser, findAndGenerateToken } = require('../models/user.model');
const { generateRefreshToken } = require('../models/refreshToken.model');
const bcrypt = require('bcryptjs')

/**
 * Returns a formated object with tokens
 * @private
 */
exports.generateTokenResponse = async (user, accessToken) => {
  const tokenType = 'Bearer';
  const refreshToken = await generateRefreshToken(user);
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    let password = req.body.password
    const rounds = env === 'test' ? 1 : 10;
    const hash = await bcrypt.hash(password, rounds);
    password = hash;

    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: password,
      services: "email/password",
      role: ROLE_USER,
      picture: ''
    };
  
    const user = await saveUser(userData);
    console.log("USER",user)
    const token = await this.generateTokenResponse(user, user.token);
    res.status(httpStatus.CREATED);
    return res.json({ token, user });
  } catch (error) {
    return next(checkDuplicateUser(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const { user, accessToken } = await findAndGenerateToken(req.body);
    const token = await this.generateTokenResponse(user, accessToken);
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const accessToken = user.token();
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { user, accessToken } = { user: 1212, accessToken: "sasa"};
    const response = generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

exports.sendPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = {};

    if (user) {
      const passwordResetObj = {};
      emailProvider.sendPasswordReset(passwordResetObj);
      res.status(httpStatus.OK);
      return res.json('success');
    }
    throw new APIError({
      status: httpStatus.UNAUTHORIZED,
      message: 'No account found with that email',
    });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password, resetToken } = req.body;
    const resetTokenObject = {}

    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (!resetTokenObject) {
      err.message = 'Cannot find matching reset token';
      throw new APIError(err);
    }
    if (moment().isAfter(resetTokenObject.expires)) {
      err.message = 'Reset token is expired';
      throw new APIError(err);
    }

    const user = {};
    user.password = password;
    await user.save();
    emailProvider.sendPasswordChangeEmail(user);

    res.status(httpStatus.OK);
    return res.json('Password Updated');
  } catch (error) {
    return next(error);
  }
};
