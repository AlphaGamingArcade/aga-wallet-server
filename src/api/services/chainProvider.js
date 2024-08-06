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
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    const { senderMnemonic, recipientAddress, amount } = transferAssetObject;
  
    try {
        const keyring = new Keyring({ type: 'sr25519' });
        const sender = keyring.addFromMnemonic(senderMnemonic);
        const { nonce } = await api.query.system.account(sender.address);
        const transfer = api.tx.balances.transferAllowDeath(recipientAddress, BigInt(amount));
  
        const result = await new Promise((resolve, reject) => {
            transfer.signAndSend(sender, { nonce }, ({ events = [], status }) => {
            if (status.isInBlock) {
                let success = false;
                let errorMsg = '';
    
                events.forEach(({ event: { data, method, section }, phase }) => {
                    if (section === 'system' && method === 'ExtrinsicFailed') {
                        const [dispatchError] = data;
                        if (dispatchError.isModule) {
                        const decoded = api.registry.findMetaError(dispatchError.asModule);
                        const { documentation, name, section } = decoded;
        
                        errorMsg = `${section}.${name}: ${documentation.join(' ')}`;
                        } else {
                        errorMsg = dispatchError.toString();
                        }
                    } else if (section === 'system' && method === 'ExtrinsicSuccess') {
                        success = true;
                    }
                });
    
                if (success) {
                    resolve({
                        message: `Transaction included in block: ${status.asInBlock.toHex()}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: transfer.hash.toHex(),
                        success: true
                    });
                } else {
                    resolve({
                        message: `Transaction failed: ${errorMsg}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: transfer.hash.toHex(),
                        success: false
                    });
                }
            } else if (status.isFinalized) {
                resolve({
                    message: `Transaction finalized in block: ${status.asFinalized.toHex()}`,
                    block_hash: status.asFinalized.toHex(),
                    transaction_hash: transfer.hash.toHex(),
                    success: true
                });
            }
            }).catch(error => {
                reject(error);
            });
        });
        return result;
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
};

exports.getTransactionDetails = async (txHash) => {
    const wsProvider = new WsProvider(provider)
    const api = await ApiPromise.create({ provider: wsProvider });
    try {
      // returns SignedBlock
      const signedBlock = await api.rpc.chain.getBlock(txHash);
      await api.disconnect();
      return {};
    } catch (error) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    } finally {
        await api.disconnect();
    }
}

exports.getBlockByHash = async (blockHash) => {
    const wsProvider = new WsProvider(provider)
    const api = await ApiPromise.create({ provider: wsProvider });
    try {
        // returns SignedBlock
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        await api.disconnect();

        return signedBlock;
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
}

exports.getWalletsBalance = async (addresses) => {
    const wsProvider = new WsProvider(provider)
    const api = await ApiPromise.create({ provider: wsProvider });
    try {
        const balancesPromise = new Promise((resolve, reject) => {
            api.query.system.account.multi([...addresses], (balances) => {
                try {
                    const addressData = balances.map(({ data }, index) => {
                        const balance = data.toJSON();
                        const readableBalance = {
                            free: this.convertPlanckToDecimal(Number(new BigNumber(balance.free))),
                            reserved: this.convertPlanckToDecimal(Number(new BigNumber(balance.reserved))),
                            miscFrozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.frozen))),
                            feeFrozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.flags))),
                        };
                        return {
                            accountAddress: addresses[index],
                            tokenSymbol: "AGA",
                            ...readableBalance
                        }
                    });
                    resolve(addressData);
                } catch (error) {
                    reject(error);
                }
            }).then(unsub => {
                unsub();
            }).catch(reject);
        });

        const addressData = await balancesPromise;
        return addressData;
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
}

exports.getWalletBalance = async (address) => {
    const wsProvider = new WsProvider(provider)
    const api = await ApiPromise.create({ provider: wsProvider });
    try {
        // Retrieve the account balance & nonce via the system module
        const { data } = await api.query.system.account(address);
        const balance = data.toJSON();
        const readableBalance = {
            free: this.convertPlanckToDecimal(Number(new BigNumber(balance.free))),
            reserved: this.convertPlanckToDecimal(Number(new BigNumber(balance.reserved))),
            miscFrozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.frozen))),
            feeFrozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.flags))),
        };
        return {
            accountAddress: address,
            tokenSymbol: "AGA",
            ...readableBalance
        }
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
}