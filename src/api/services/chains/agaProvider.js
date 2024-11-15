const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { agaProvider: provider } = require('../../../config/vars');
const httpStatus = require('http-status');
const APIError = require('../../errors/api-error');
const BigNumber = require('bignumber.js');
const { formatDecimalsFromToken } = require('../../utils/helper');
const { u8aToHex } = require('@polkadot/util');

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
    await api.isReady;

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
    await api.isReady;

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
    await api.isReady;

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
    await api.isReady;
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
    await api.isReady;
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
    await api.isReady;

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
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed retrieving assets.',
        });
    } finally {
        // Disconnect from the node
        await api.disconnect();
    }
}

const pageSize = 10; // Number of items per page
let startKey = null;

async function getAssetKeysPaged(api) {
  const keys = await api.rpc.state.getKeysPaged(
    api.query.assets.asset.key(), // The storage key prefix for assets
    pageSize,
    startKey
  );
  
  // Use these keys to fetch the actual asset data
  const assets = await Promise.all(
    keys.map(key => api.query.assets.asset(key))
  );

  // Update the startKey for the next page
  startKey = keys.length > 0 ? keys[keys.length - 1] : null;

  return assets;
}


exports.listAssets = async () => {
    // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;  

    try {
        // Retrieve all asset entries
        const assetEntries = await api.query.assets.asset.entries();

        // Fetch metadata for each asset and map over entries
        const assets = await Promise.all(
            assetEntries.map(async ([key, assetData]) => {
                const assetId = key.args[0]; // Extract asset ID
                const metadata = await api.query.assets.metadata(assetId); // Fetch metadata for the asset
                const { owner, supply } = assetData.toHuman();
                
                console.log(assetData.toHuman())

                return {
                    id: assetId.toString(),
                    owner,
                    supply,
                    name: metadata.name.toUtf8(),         // Asset name
                    symbol: metadata.symbol.toUtf8(),     // Asset symbol
                    decimals: metadata.decimals.toNumber() // Asset decimals
                };
            })
        );

         // Add the native utility token
         const nativeTokenSupply = await api.query.balances.totalIssuance();
         const nativeToken = {
             id: 'Native',            // Custom identifier for the native token
             owner: 'N/A',            // Typically there’s no single owner for the native token
             supply: nativeTokenSupply.toHuman(),
             name: 'AGA',   // Set a descriptive name
             symbol: 'AGA',          // Symbol for the utility token
             decimals: 12             // Common default for Substrate chains, adjust if necessary
         };

        return { assets: [nativeToken, ...assets, ] };
    } catch (error) {
        console.error('Error retrieving assets:', error);
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed retrieving assets.',
        });
    } finally {
        await api.disconnect();
    }
};

exports.getChainProperties = async () => { 
     // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;

    try {
        const tokenMetadata = api.registry.getChainProperties();
        return tokenMetadata
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed retrieving chain properties.',
        });
    } finally {
        await api.disconnect();
    }
}


exports.getAccountTokensBalance = async (walletAddress) => {
    // Connect to the blockchain node
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;

    try {
        const now = await api.query.timestamp.now();
    const { data: balance } = await api.query.system.account(walletAddress);
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
  
    const balanceFormatted = formatDecimalsFromToken(balance?.free.toString(), tokenDecimals);
  
    return {
      balance: balanceFormatted,
      ss58Format,
      existentialDeposit: existentialDeposit.toHuman(),
      tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
      tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
      assets: myAssetTokenData,
    };
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed retrieving pools.',
        });
    } finally {
        await api.disconnect();
    }
};


exports.getPools = async () => {
    const wsProvider = new WsProvider(provider); // Replace with your node endpoint
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;

    try {
        const pools = await api.query.assetConversion.pools.entries();
        return pools.map(([key, value]) => [key.args[0], value ])
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed retrieving pools.',
        });
    } finally {
        await api.disconnect();
    }
}

exports.getReserves = async (pair) => {
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;

    try {
        const asset1 = api.createType('FrameSupportTokensFungibleUnionOfNativeOrWithId', pair[0]).toU8a();
        const asset2 = api.createType('FrameSupportTokensFungibleUnionOfNativeOrWithId', pair[1]).toU8a();

        // concatenate  Uint8Arrays of input parameters
        const encodedInput = new Uint8Array(asset1.length + asset2.length);
        encodedInput.set(asset1, 0); // Set array1 starting from index 0
        encodedInput.set(asset2, asset1.length); // Set array2 starting from the end of array1
      
        // create Hex from concatenated u8a
        const encodedInputHex = u8aToHex(encodedInput);
      
        // call rpc state call where first parameter is method to be called and second one is Hex representation of encoded input parameters
        const reserves = await api.rpc.state.call('AssetConversionApi_get_reserves', encodedInputHex)
      
        // decode response
        const decoded = api.createType('Option<(u128, u128)>', reserves);

        // Check if the result is null
        if(decoded.isNone){
            throw new APIError({
                status: httpStatus.NOT_FOUND,
                message: 'Reserves not found.',
            });
        }

        return decoded.toHuman()
    } catch (error) {
        console.log(error)
        throw new APIError({
            status: error.status || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || "Failed retrieving reserves",
        });
    } finally {
        await api.disconnect();
    }
}

exports.getQuotePriceExactTokensForTokens = async (pair, amountValue, includeFee) => {
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;

    try {
        const asset1 = api.createType('FrameSupportTokensFungibleUnionOfNativeOrWithId', pair[0]).toU8a();
        const asset2 = api.createType('FrameSupportTokensFungibleUnionOfNativeOrWithId', pair[1]).toU8a();
        const amount = api.createType('u128', amountValue).toU8a();
        const includeFeeValue = api.createType('bool', includeFee).toU8a();
    
        const encodedInput = new Uint8Array(asset1.length + asset2.length + amount.length + includeFeeValue.length);
        encodedInput.set(asset1, 0);
        encodedInput.set(asset2, asset1.length);
        encodedInput.set(amount, asset1.length + asset2.length);
        encodedInput.set(includeFeeValue, asset1.length + asset2.length + amount.length);
    
        const encodedInputHex = u8aToHex(encodedInput);
        const response = await api.rpc.state.call('AssetConversionApi_quote_price_exact_tokens_for_tokens', encodedInputHex);
        const decodedPrice = api.createType('Option<u128>', response);

        // Check if the result is null
        if(decodedPrice.isNone){
            throw new APIError({
                status: httpStatus.NOT_FOUND,
                message: 'Quote not found for this asset pair.',
            });
        }

        return decodedPrice.toString();
    } catch (error) {
        console.log(error)
        throw new APIError({
            status: error.status || httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || "Failed retriving quote price",
        });
    } finally {
      await api.disconnect();
    }
  };
  
exports.swapExactTokensForTokens = async (options) => {
    const { mnemonic, pair, amount_in, amount_out_min } = options;

    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    try {
        const keyring = new Keyring({ type: 'sr25519' });
        const sender = keyring.addFromMnemonic(mnemonic);
        const { nonce } = await api.query.system.account(sender.address);
        const timestamp = await api.query.timestamp.now();

        const swap = api.tx.assetConversion.swapExactTokensForTokens(
            [pair[0], pair[1]], // path array
            amount_in, // amount of tokens to swap
            amount_out_min, // minimum amount of token2 user wants to receive
            sender.address, // address to receive swapped tokens
            false // Keep alive parameter
        )
        const result = await new Promise((resolve, reject) => {
            swap.signAndSend(sender, { nonce }, ({ events = [], status }) => {
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
                        transaction_hash: swap.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: true
                    });
                } else {
                    resolve({
                        message: `Transaction failed: ${errorMsg}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: swap.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: false
                    });
                }
            } else if (status.isFinalized) {
                resolve({
                    message: `Transaction finalized in block: ${status.asFinalized.toHex()}`,
                    block_hash: status.asFinalized.toHex(),
                    transaction_hash: swap.hash.toHex(),
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
        console.log(error)
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
}

// exports.listLiquidityPools = async () => {
//     const { mnemonic, pair, amount_in, amount_out_min } = options;

//     const wsProvider = new WsProvider(provider);
//     const api = await ApiPromise.create({ provider: wsProvider });
//     await api.isReady;

//     try {

//     } catch (error) {
        
//     } finally {
//         await api.disconnect();
//     }
// }

exports.createPool = async (options) => {
    const { mnemonic, pair } = options;
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    try {
        const keyring = new Keyring({ type: 'sr25519' });
        const sender = keyring.addFromMnemonic(mnemonic);
        const { nonce } = await api.query.system.account(sender.address);
        const timestamp = await api.query.timestamp.now();

        const pool = api.tx.assetConversion.createPool(pair[0],pair[1]);
        const result = await new Promise((resolve, reject) => {
            pool.signAndSend(sender, { nonce }, ({ events = [], status }) => {
            if (status.isInBlock) {
                let success = false;
                let errorMsg = '';
    
                events.forEach(({ event: { data, method, section }, phase }) => {
                    if (section === 'system' && method === 'ExtrinsicFailed') {
                        const [dispatchError] = data;
                        if (dispatchError.isModule) {
                        const decoded = api.registry.findMetaError(dispatchError.asModule);
                        const { docs, name, section } = decoded;

                        errorMsg = `${section}.${name}: ${docs.join(' ')}`;
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
                        transaction_hash: pool.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: true
                    });
                } else {
                    resolve({
                        message: `Transaction failed: ${errorMsg}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: pool.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: false
                    });
                }
            } else if (status.isFinalized) {
                resolve({
                    message: `Transaction finalized in block: ${status.asFinalized.toHex()}`,
                    block_hash: status.asFinalized.toHex(),
                    transaction_hash: swap.hash.toHex(),
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
        console.log(error)
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }

}


exports.addLiquidity = async (options) => {
    const { mnemonic, pair, amount1_desired, amount2_desired, amount1_min, amount2_min } = options;
    console.log("Options", options)
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    try {
        const keyring = new Keyring({ type: 'sr25519' });
        const sender = keyring.addFromMnemonic(mnemonic);
        const { nonce } = await api.query.system.account(sender.address);
        const timestamp = await api.query.timestamp.now();

        const swap = api.tx.assetConversion.addLiquidity(
            pair[0],
            pair[1],
            amount1_desired, // desired amount of token1 to provide as liquidity (calculations happen when tx in executed)
            amount2_desired, // desired amount of token2 to provide as liquidity
            amount1_min, // minimum amount of token1 to provide as liquidity
            amount2_min, // minimum amount of token2 to provide as liquidity
            sender.address, // address to receive swapped tokens
        )

        const result = await new Promise((resolve, reject) => {
            swap.signAndSend(sender, { nonce }, ({ events = [], status }) => {
            if (status.isInBlock) {
                let success = false;
                let errorMsg = '';
    
                events.forEach(({ event: { data, method, section }, phase }) => {
                    if (section === 'system' && method === 'ExtrinsicFailed') {
                        const [dispatchError] = data;
                        if (dispatchError.isModule) {
                        const decoded = api.registry.findMetaError(dispatchError.asModule);
                        const { docs, name, section } = decoded;

                        errorMsg = `${section}.${name}: ${docs.join(' ')}`;
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
                        transaction_hash: swap.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: true
                    });
                } else {
                    resolve({
                        message: `Transaction failed: ${errorMsg}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: swap.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: false
                    });
                }
            } else if (status.isFinalized) {
                resolve({
                    message: `Transaction finalized in block: ${status.asFinalized.toHex()}`,
                    block_hash: status.asFinalized.toHex(),
                    transaction_hash: swap.hash.toHex(),
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
        console.log(error)
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
}

exports.removeLiquidity = async (options) => {
    const { mnemonic, pair, lp_token_amount, amount1_min_receive, amount2_min_receive } = options;
    const wsProvider = new WsProvider(provider);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    try {
        const keyring = new Keyring({ type: 'sr25519' });
        const sender = keyring.addFromMnemonic(mnemonic);
        const { nonce } = await api.query.system.account(sender.address);
        const timestamp = await api.query.timestamp.now();

        const swap = api.tx.assetConversion.removeLiquidity(
            pair[0],
            pair[1],
            lp_token_amount, // desired amount of token1 to provide as liquidity (calculations happen when tx in executed)
            amount1_min_receive, // desired amount of token2 to provide as liquidity
            amount2_min_receive, // minimum amount of token1 to provide as liquidity
            sender.address, // address to receive swapped tokens
        )

        const result = await new Promise((resolve, reject) => {
            swap.signAndSend(sender, { nonce }, ({ events = [], status }) => {
            if (status.isInBlock) {
                let success = false;
                let errorMsg = '';
    
                events.forEach(({ event: { data, method, section }, phase }) => {
                    if (section === 'system' && method === 'ExtrinsicFailed') {
                        const [dispatchError] = data;
                        if (dispatchError.isModule) {
                        const decoded = api.registry.findMetaError(dispatchError.asModule);
                        const { docs, name, section } = decoded;
        
                        errorMsg = `${section}.${name}: ${docs.join(' ')}`;
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
                        transaction_hash: swap.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: true
                    });
                } else {
                    resolve({
                        message: `Transaction failed: ${errorMsg}`,
                        block_hash: status.asInBlock.toHex(),
                        transaction_hash: swap.hash.toHex(),
                        timestamp: timestamp.toNumber().toString(),
                        success: false
                    });
                }
            } else if (status.isFinalized) {
                resolve({
                    message: `Transaction finalized in block: ${status.asFinalized.toHex()}`,
                    block_hash: status.asFinalized.toHex(),
                    transaction_hash: swap.hash.toHex(),
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
        console.log(error)
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await api.disconnect();
    }
}