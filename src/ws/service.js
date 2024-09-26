const moment = require('moment-timezone');
const QrRoom = require('../api/models/qrroom.model');
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require('../api/utils/constants');

async function joinRoom(token, clientId) {
    const expires = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    await QrRoom.saveQrRoom({
        token,
        clientId,
        expires
    });
}

async function leaveRooms(clientId) {
    await QrRoom.remove({
        condition: `qr_room_client_id='${clientId}'`
    });
}

async function listClientsInRoom(room) {
    return await QrRoom.list({
        condition: `qr_room_token='${room}'`,
        sortBy: "qr_room_id",
        orderBy: "asc",
        limit: DEFAULT_QUERY_LIMIT,
        offset: DEFAULT_QUERY_OFFSET
    });
}

module.exports = { joinRoom, leaveRooms, listClientsInRoom };