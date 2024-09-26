const { WebSocketServer } = require('ws');
const { generateQRSessionToken, approveQrLogin } = require('../api/controllers/qrsession.controller');

const wss = new WebSocketServer({ noServer: true });
const rooms = {}; // Store rooms and clients

function onSocketPreError(e) {
    console.log(e);
}

function onSocketPostError(e) {
    console.log(e);
}

// Join a client to a specific room
function joinRoom(room, ws) {
    if (!rooms[room]) {
        rooms[room] = new Set(); // Create a room if it doesn't exist
    }
    rooms[room].add(ws); // Add the client (WebSocket) to the room
    console.log(`Client joined room: ${room}`);
}

// Remove a client from all rooms when they disconnect
function leaveRooms(ws) {
    console.log(rooms)
    for (const room in rooms) {
        if (rooms[room].has(ws)) {
            rooms[room].delete(ws); // Remove the client from the room
            console.log(`Client left room: ${room}`);
            // If the room is empty, delete it
            if (rooms[room].size === 0) {
                delete rooms[room];
            }
        }
    }
}

// Broadcast message to all clients in a specific room
function broadcastToRoom(room, message) {
    if (rooms[room]) {
        rooms[room].forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

function handleUpgrade(req, socket, head) {
    socket.on('error', onSocketPreError);

    if (!!req.headers['BadAuth']) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        socket.removeListener('error', onSocketPreError);
        wss.emit('connection', ws, req);
    });
}

wss.on('connection', (ws, req) => {
    ws.on('error', onSocketPostError);

    ws.on('message', async (msg, _isBinary) => {
        try {
            const data = JSON.parse(msg.toString());

            // Handle QR login, generate a token, and add the client to a "room"
            if (data.type === "qr_login") {
                const token = await generateQRSessionToken();

                // Join the WebSocket client to a room identified by the QR token
                joinRoom(token, ws);

                const response = JSON.stringify({
                    type: "qr_login",
                    token: token,
                });

                ws.send(response);
            }

            // Handle QR login approval
            if (data.type === "qr_login_approved") {
                const token = data.token;
                const userId = data.user_id;
                await approveQrLogin({ token, userId });

                const response = JSON.stringify({
                    type: "qr_login_approved",
                    token: token,
                    ...data
                });

                // Broadcast the approval message to all clients in the room
                broadcastToRoom(token, response);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        // Remove the client from all rooms when they disconnect
        leaveRooms(ws);
        console.log("Connection closed.");
    });
});

module.exports = { wss, handleUpgrade };
