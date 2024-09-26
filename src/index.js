// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, wsPort, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const { handleUpgrade } = require('./config/ws');
const http = require('http');

// Intantiate Web Socket
const server = http.createServer(app);

// Attach the WebSocket server upgrade logic
server.on("upgrade", (req, socket, head) => {
    handleUpgrade(req, socket, head);
})

// Listen on the WS Port
server.listen(wsPort, () => logger.info(`WS Server started on port ${wsPort} (${env})`));

// listen to requests
app.listen(port, () => logger.info(`server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
module.exports = app;
