const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { provider } = require('../../../config/vars');
const httpStatus = require('http-status');
const APIError = require('../../errors/api-error');
const BigNumber = require('bignumber.js');
const { formatDecimalsFromToken } = require('../../utils/helper');

exports.convertToPlanks = (amountPerUnit) => {
    const plancksPerUnit = 1000000000000;
    return amountPerUnit * plancksPerUnit;
}

// Function to convert Plancks to DOT
exports.convertPlanckToDecimal = (amountInPlanck) => {
    const plancksPerDot = 1000000000000;
    return Number(amountInPlanck) / plancksPerDot;
}  

exports.substrateTransferAsset = async (transferAssetObject) => {
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    const { senderMnemonic, senderAddress, recipientAddress, amount } = transferAssetObject;
  
    try {
        const keyring = new Keyring({ type: 'sr25519' });
        const sender = keyring.addFromMnemonic(senderMnemonic);
        const { nonce } = await api.query.system.account(sender.address);
        const timestamp = await api.query.timestamp.now();
        const transfer = api.tx.balances.transferAllowDeath(recipientAddress, BigInt(amount));
        
        // Ensure the sender address matches the derived address from the mnemonic
        const derivedAddress = sender.address;
        if (derivedAddress !== senderAddress) {
            throw new Error('The sender address does not match the address derived from the mnemonic.');
        }

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
                        timestamp: timestamp.toNumber().toString(),
                        success: true
                    });
                } else {
                    resolve({
                        message: `Transaction failed: ${errorMsg}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: transfer.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: false
                    });
                }
            } else if (status.isFinalized) {
                resolve({
                    message: `Transaction finalized in block: ${status.asFinalized.toHex()}`,
                    block_hash: status.asFinalized.toHex(),
                    transaction_hash: transfer.hash.toHex(),
                    timestamp: timestamp.toNumber().toString(),
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

exports.getAccountsBalance = async (addresses) => {
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
                            misc_frozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.frozen))),
                            fee_frozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.flags))),
                        };
                        return {
                            account_address: addresses[index],
                            token_symbol: "AGA",
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

exports.getAccountBalance = async (address) => {
    const wsProvider = new WsProvider(provider)
    const api = await ApiPromise.create({ provider: wsProvider });
    try {
        // Retrieve the account balance & nonce via the system module
        const { data } = await api.query.system.account(address);
        const balance = data.toJSON();
        const readableBalance = {
            free: this.convertPlanckToDecimal(Number(new BigNumber(balance.free))),
            reserved: this.convertPlanckToDecimal(Number(new BigNumber(balance.reserved))),
            misc_frozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.frozen))),
            fee_frozen: this.convertPlanckToDecimal(Number(new BigNumber(balance.flags))),
        };
        return {
            account_address: address,
            token_symbol: "AGA",
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

exports.getTransactions = async (options) => {
    const { walletAddress } = options
    // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });
  
    try {
       // Fetch the latest block number
        const latestHeader = await api.rpc.chain.getHeader();
        const latestBlockNumber = latestHeader.number.toNumber();

        console.log(`Latest block number: ${latestBlockNumber}`);

        // Define the range of blocks to scan (e.g., last 100 blocks)
        const startBlockNumber = Math.max(0, latestBlockNumber - 100);

        // Loop through the blocks and query events
        for (let blockNumber = startBlockNumber; blockNumber <= latestBlockNumber; blockNumber++) {
            const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
            const events = await api.query.system.events.at(blockHash);

            events.forEach(({ event }) => {
            const { method, section } = event;

            // Filter events related to balances transfer
            if (section === 'balances' && method === 'Transfer') {
                const [from, to, amount] = event.data;

                if (from.toString() === walletAddress || to.toString() === walletAddress) {
                console.log(`Transaction found in block ${blockNumber}:`);
                console.log(`From: ${from.toString()}`);
                console.log(`To: ${to.toString()}`);
                console.log(`Amount: ${amount.toString()}`);
                }
            }
            });
        }
    } catch (error) {
        console.log(error)
    } finally {
        // Disconnect from the node
        await api.disconnect();
    }
}

exports.listAssets = async () => {
    // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });

    try {
        let chainAssets = [];
        const assets = await api.query.assets.asset.keys();
        
        for (let asset of assets) {
            const assetId = asset.args[0].toHuman();
            const assetDetails = await api.query.assets.asset(assetId);
            const assetMetadata = await api.query.assets.metadata(assetId);
            const assetData = {
                asset_id: assetId,
                asset_details: assetDetails.toHuman(),
                asset_metadata: assetMetadata.toHuman()
            }
            chainAssets.push(assetData)
        }

        return { assets: chainAssets }
     } catch (error) {
         console.log(error)
     } finally {
         // Disconnect from the node
         await api.disconnect();
     }
}

exports.getChainProperties = async () => { 
     // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });
    try {
        const tokenMetadata = api.registry.getChainProperties();
        return tokenMetadata
    } catch (error) {
        await api.disconnect();
    }
}

exports.getAccountTokensBalance = async (walletAddress) => {
    // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });

    const now = await api.query.timestamp.now();
    const { nonce, data: balance } = await api.query.system.account(walletAddress);
    const nextNonce = await api.rpc.system.accountNextIndex(walletAddress);
    const tokenMetadata = api.registry.getChainProperties();
    const existentialDeposit = await api.consts.balances.existentialDeposit;
  
    const allAssets = await api.query.assets.asset.entries();
  
    const allChainAssets = [];
  
    allAssets.forEach((item) => {
      allChainAssets.push({ tokenData: item?.[1].toHuman(), tokenId: item?.[0].toHuman() });
    });
  
    const myAssetTokenData = [];
    const assetTokensDataPromises = [];
  
    for (const item of allChainAssets) {
      const cleanedTokenId = item?.tokenId?.[0]?.replace(/[, ]/g, "");
      assetTokensDataPromises.push(
        Promise.all([
          api.query.assets.account(cleanedTokenId, walletAddress),
          api.query.assets.metadata(cleanedTokenId),
        ]).then(([tokenAsset, assetTokenMetadata]) => {
          if (tokenAsset.toHuman()) {
            const resultObject = {
              tokenId: cleanedTokenId,
              assetTokenMetadata: assetTokenMetadata.toHuman(),
              tokenAsset: tokenAsset.toHuman(),
            };
            return resultObject;
          }
          return null;
        })
      );
    }
  
    const results = await Promise.all(assetTokensDataPromises);
  
    myAssetTokenData.push(...results.filter((result) => result !== null));
  
    const ss58Format = tokenMetadata?.ss58Format.toHuman();
    const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
    const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();
  
    console.log(`${now}: balance of ${balance?.free} and a current nonce of ${nonce} and next nonce of ${nextNonce}`);
  
    const balanceFormatted = formatDecimalsFromToken(balance?.free.toString(), tokenDecimals);
  
    return {
      balance: balanceFormatted,
      ss58Format,
      existentialDeposit: existentialDeposit.toHuman(),
      tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
      tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
      assets: myAssetTokenData,
    };
  };