const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment-timezone');
const { approveQrSession } = require('../models/qrsession.model');

exports.generateQrRoomToken = async () => {
    const randomId = uuidv4();
    const token = `${randomId}.${crypto.randomBytes(40).toString('hex')}`;
    return token;
}

exports.approveQrLogin = async (options) => {
    const { token, userId } = options;
    const result = await approveQrSession({
        token,
        userId
    });
    return result;
}