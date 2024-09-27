
const { WebSocketServer } = require('ws');
const { handleMessage } = require('../ws/handler');
const { v4: uuidv4 } = require('uuid');
const { leaveRooms } = require('../ws/service');

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Log socket errors
function onSocketError(error) {
    console.error('WebSocket error:', error);
}

// Handle socket upgrade
function handleUpgrade(req, socket, head) {
    socket.on('error', onSocketError);

    if (req.headers['BadAuth']) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        socket.removeListener('error', onSocketError);
        wss.emit('connection', ws, req);
    });
}

// Handle new connections
wss.on('connection', (ws) => {
    ws.id = uuidv4(); // Assign a unique ID to the WebSocket
    ws.on('error', onSocketError);

    ws.on('message', async (msg) => {
        await handleMessage(ws, msg, wss); // Delegate message handling
    });

    ws.on('close', async () => {
        await leaveRooms(ws.id);
    });
});

module.exports = { wss, handleUpgrade };