const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { provider } = require('../../config/vars');
const httpStatus = require('http-status');
const APIError = require('../errors/api-error');
const BigNumber = require('bignumber.js');

exports.convertToPlanks = (amountPerUnit) => {
    const plancksPerUnit = 1000000000000;
    return amountPerUnit * plancksPerUnit;
}

// Function to convert Plancks to DOT
exports.convertPlanckToDecimal = (amountInPlanck) => {
    const plancksPerDot = 1000000000000;
    return Number(amountInPlanck) / plancksPerDot;
}  

exports.transferAsset = async (transferAssetObject) => {
   try {
    const { senderMnemonic, recipientAddress, amount } = transferAssetObject;
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider })
    const keyring = new Keyring({ type: 'sr25519' });
    const sender = keyring.addFromMnemonic(senderMnemonic);
    const { nonce } = await api.query.system.account(sender.address);

    const transfer = api.tx.balances.transferAllowDeath(recipientAddress, BigInt(amount));
    transfer.signAndSend(sender, { nonce }, ({ events = [], status }) => {
        console.log('Transaction status:', status.type);
        if (status.isInBlock) {
            console.log('Included at block hash', status.asInBlock.toHex());
            console.log('Events:');
            events.forEach(({ event: { data, method, section }, phase }) => {
                console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
            });
        } else if (status.isFinalized) {
            console.log('Finalized block hash', status.asFinalized.toHex());
        }
    });
    return { message: `Transaction submitted with hash: ${transfer.hash.toHex()}`}
   } catch (error) {
        throw new APIError({
            status: httpStatus.BAD_REQUEST,
            message: error.message,
        });
   }
}

exports.getTransactionDetails = async (txHash) => {
    try {
      const wsProvider = new WsProvider(provider);
      const api = await ApiPromise.create({ provider: wsProvider });
      // returns SignedBlock
      const signedBlock = await api.rpc.chain.getBlock(txHash);
      await api.disconnect();
      return {};
    } catch (error) {
      throw new APIError({
        status: httpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
}

exports.getBlockByHash = async (blockHash) => {
    try {
        const wsProvider = new WsProvider(provider);
        const api = await ApiPromise.create({ provider: wsProvider });
        // returns SignedBlock
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        await api.disconnect();

        return signedBlock;
    } catch (error) {
        throw new APIError({
            status: httpStatus.BAD_REQUEST,
            message: error.message,
        });
    }
}

exports.getWalletBalance = async (address) => {
    try {
        const wsProvider = new WsProvider(provider);
        const api = await ApiPromise.create({ provider: wsProvider });
        const now = await api.query.timestamp.now();
        const { nonce, data: balance } = await api.query.system.account(address);
        await api.disconnect();

        const readableBalance = {
            free: this.convertPlanckToDecimal(Number(new BigNumber(balance.free))),
            reserved: this.convertPlanckToDecimal(Number(new BigNumber(balance.reserved))),
            miscFrozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.frozen))),
            feeFrozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.flags))),
        };
      
        return { nonce: Number(new BigNumber(nonce)), balance: readableBalance, timestamp: Number(new BigNumber(now)) }
    } catch (error) {
        throw new APIError({
            status: httpStatus.BAD_REQUEST,
            message: error.message,
        });
    }
}
