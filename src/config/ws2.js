const { WebSocketServer, WebSocket } = require('ws');
const { generateQRSessionToken, approveQrLogin } = require('../api/controllers/qrsession.controller');

const wss = new WebSocketServer({ noServer: true });

function onSocketPreError(e) {
    console.log(e);
}

function onSocketPostError(e) {
    console.log(e);
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
            if (data.type === "qr_login") {
                const token = await generateQRSessionToken();
                const response = JSON.stringify({
                    type: "qr_login",
                    token: token,
                });
                ws.send(response);
            }
            if (data.type === "qr_login_approved") {
                const token = data.token;
                const userId = data.user_id;
                await approveQrLogin({ token, userId });
                
                const response = JSON.stringify({
                    type: "qr_login_approved",
                    token: token,
                    ...data
                });
                ws.send(response);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    })

    ws.on('close', () => {
        console.log("Connection closed.")
    });
})



module.exports = { wss, handleUpgrade };
