// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');


// listen to requests
app.listen(port, () => logger.info(`server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
module.exports = app;


// // Required imports
// const { ApiPromise, WsProvider } = require('@polkadot/api');

// async function main () {
//   // Initialise the provider to connect to the local node
//   const provider = new WsProvider('ws://45.32.113.44:9946');

//   // Create the API and wait until ready
//   const api = await ApiPromise.create({ provider });

//   // Retrieve the chain & node information via rpc calls
//   const [chain, nodeName, nodeVersion] = await Promise.all([
//     api.rpc.system.chain(),
//     api.rpc.system.name(),
//     api.rpc.system.version()
//   ]);

//   console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
// }

// main().catch(console.error).finally(() => process.exit());