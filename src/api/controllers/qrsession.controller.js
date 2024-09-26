const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment-timezone');
const { saveQrSessionToken, approveQrSession } = require('../models/qrsession.model');

exports.generateQRSessionToken = async () => {
    const randomId = uuidv4();
    const token = `${randomId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment().add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
    const refreshToken = await saveQrSessionToken({
        token,
        expires
    });
    return refreshToken.token;
}

exports.approveQrLogin = async (options) => {
    const { token, userId } = options;
    const result = await approveQrSession({
        token,
        userId
    });
    return result;
}