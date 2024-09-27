const { generateQrRoomToken } = require('../api/controllers/qrroom.controller');
const { joinRoom, listClientsInRoom } = require('./service');
const { WebSocket } = require('ws');

// Broadcast a message to all clients in a room
async function handleRoomMessage(wss, data) {
    const clients = await listClientsInRoom(data.token);

    clients.rooms.forEach((room) => {
        Array.from(wss.clients).forEach(client => {
            if (client.id === room.qr_room_client_id) {
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "room_message",
                        token: data.token,
                        extra: "THIS IS A MESSAGE"
                    }));
                }
            }
        })
    });
}

// Handle QR login join room
async function handleQrLoginJoinRoom(ws, data) {
    await joinRoom(data.token, ws.id);
    ws.send(JSON.stringify({
        type: "qr_login_join_room",
        token: data.token,
    }));
}

// Handle QR login and generate a new room token
async function handleQrLogin(ws) {
    const token = await generateQrRoomToken();
    ws.send(JSON.stringify({
        type: "qr_login",
        token: token,
    }));
}

// Handle QR login approval
async function handleQrLoginApproved(wss, data) {
    const clients = await listClientsInRoom(data.token);
    clients.rooms.forEach((room) => {
        Array.from(wss.clients).forEach(client => {
            if (client.id === room.qr_room_client_id){
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "qr_login_approved",
                        token: data.token,
                        refresh_token: data.refresh_token,
                        email: data.email,
                    }));
                }
            }
        })
    });
}

// Handle different WebSocket message types
async function handleMessage(ws, msg, wss) {
    try {
        const data = JSON.parse(msg);
        switch (data.type) {
            case "room_message":
                await handleRoomMessage(wss, data);
                break;

            case "qr_login_join_room":
                await handleQrLoginJoinRoom(ws, data);
                break;

            case "qr_login":
                await handleQrLogin(ws);
                break;

            case "qr_login_approved":
                await handleQrLoginApproved(wss, data);
                break;

            default:
                console.log(`Unknown message type: ${data.type}`);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
}

module.exports = { handleMessage, handleQrLoginJoinRoom, handleQrLogin, handleQrLoginApproved };