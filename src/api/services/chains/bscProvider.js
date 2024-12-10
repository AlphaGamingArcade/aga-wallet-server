const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring, decodeAddress } = require('@polkadot/keyring');
const { bscProvider: provider, bscProvider } = require('../../../config/vars');
const httpStatus = require('http-status');
const APIError = require('../../errors/api-error');
const BigNumber = require('bignumber.js');
const { formatDecimalsFromToken } = require('../../utils/helper');

const { JsonRpcProvider, formatEther, formatUnits, Contract, ethers, parseEther } = require("ethers");
const Asset = require('../../models/asset.model');
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require('../../utils/constants');
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

exports.getAccountListAssets = async (walletAddress) => {
    // (i.e. ``http:/\/localhost:8545``)
    const provider = new JsonRpcProvider(bscProvider);
    try {
        // Get the BNB balance of the wallet
        const rawBscBalance = await provider.getBalance(walletAddress);
        const bscBalance = rawBscBalance.toString();

        const nativeAsset = {
            id: "Native",
            owner: "N/A",
            balance: bscBalance,
            supply: "N/A",
            symbol: "BSC",
            decimals: 18
        }

        const AGA_CONTRACT_ADDRESS = "0xa51Afd67b83c5f8d613F7d02Ad4D0861E527E077";
        const erc20ABI = [
            {
                "constant": true,
                "inputs": [{ "name": "account", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "", "type": "uint256" }],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{ "name": "", "type": "uint8" }],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{ "name": "", "type": "uint256" }],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "owner",
                "outputs": [{ "name": "", "type": "address" }],
                "type": "function"
            }
        ];

        // Create a contract instance
        const contract = new Contract(AGA_CONTRACT_ADDRESS, erc20ABI, provider);

        // Fetch the raw token balance
        const rawAgaBalance = await contract.balanceOf(walletAddress);
        const agaBalance = rawAgaBalance.toString();
        const rawAgaTotalSupply = await contract.totalSupply();
        const agaTotalSupply = rawAgaTotalSupply.toString();
        const tokenOwner = await contract.owner();

        const agaAsset = {
            id: AGA_CONTRACT_ADDRESS,
            owner: tokenOwner,
            supply: agaTotalSupply,
            balance: agaBalance,
            name: "AGA",
            symbol: "AGA",
            decimals: 12
        }
        
        return [nativeAsset, agaAsset]
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await provider.destroy();
    }
}

exports.getDepositFee = async (options) => {
    const { sender, amount, recipient } = options;
    const provider = new JsonRpcProvider(bscProvider);
    try {
        const FEE_ROUTER_CONTRACT = "0x0be5C15B5aBCF0D6455366bD1424b43210aE35A7";
        const FEE_ROUTER_ABI = [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "bridgeAddress",
                        "type": "address"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [],
                "name": "AccessControlBadConfirmation",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "neededRole",
                        "type": "bytes32"
                    }
                ],
                "name": "AccessControlUnauthorizedAccount",
                "type": "error"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "IncorrectFeeSupplied",
                "type": "error"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint8",
                        "name": "fromDomainID",
                        "type": "uint8"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint8",
                        "name": "destinationDomainID",
                        "type": "uint8"
                    },
                    {
                        "indexed": false,
                        "internalType": "bytes32",
                        "name": "resourceID",
                        "type": "bytes32"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "fee",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "tokenAddress",
                        "type": "address"
                    }
                ],
                "name": "FeeCollected",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "tokenAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "recipient",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "FeeDistributed",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "previousAdminRole",
                        "type": "bytes32"
                    },
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "newAdminRole",
                        "type": "bytes32"
                    }
                ],
                "name": "RoleAdminChanged",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    }
                ],
                "name": "RoleGranted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    }
                ],
                "name": "RoleRevoked",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "whitelistAddress",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "bool",
                        "name": "isWhitelisted",
                        "type": "bool"
                    }
                ],
                "name": "WhitelistChanged",
                "type": "event"
            },
            {
                "inputs": [],
                "name": "DEFAULT_ADMIN_ROLE",
                "outputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "_bridgeAddress",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint8",
                        "name": "",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "name": "_domainResourceIDToFeeHandlerAddress",
                "outputs": [
                    {
                        "internalType": "contract IFeeHandler",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "_whitelist",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint8",
                        "name": "destinationDomainID",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "resourceID",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "contract IFeeHandler",
                        "name": "handlerAddress",
                        "type": "address"
                    }
                ],
                "name": "adminSetResourceHandler",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "whitelistAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "isWhitelisted",
                        "type": "bool"
                    }
                ],
                "name": "adminSetWhitelist",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint8",
                        "name": "fromDomainID",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "destinationDomainID",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "resourceID",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes",
                        "name": "depositData",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "feeData",
                        "type": "bytes"
                    }
                ],
                "name": "calculateFee",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "fee",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "tokenAddress",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint8",
                        "name": "fromDomainID",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "destinationDomainID",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "resourceID",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes",
                        "name": "depositData",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "feeData",
                        "type": "bytes"
                    }
                ],
                "name": "collectFee",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "feeHandlerType",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "pure",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    }
                ],
                "name": "getRoleAdmin",
                "outputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "grantRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "hasRole",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "callerConfirmation",
                        "type": "address"
                    }
                ],
                "name": "renounceRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "revokeRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes4",
                        "name": "interfaceId",
                        "type": "bytes4"
                    }
                ],
                "name": "supportsInterface",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // Create a contract instance
        const contract = new Contract(FEE_ROUTER_CONTRACT, FEE_ROUTER_ABI, provider);
        
        const fromDomainID = 2;
        const destinationDomainID = 1;
        const resourceID = 0x0000000000000000000000000000000000000000000000000000000000000000;
        // Decode the address to a public key
        const publicKey = decodeAddress(recipient);
        const publicKeyHex = u8aToHex(publicKey);
        // Convert amount to bytes and pad to 32 bytes
        const amountBytes = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
        
        // Convert recipient length to bytes and pad to 32 bytes
        const recipientLength = ethers.zeroPadValue(ethers.toBeHex(publicKey.length), 32);
        
        // Concatenate all parts into a single Uint8Array
        const depositData = ethers.concat([amountBytes, recipientLength, publicKeyHex]);

        // Fetch the raw token balance
        const depositFee = await contract.calculateFee([
            sender,
            fromDomainID,
            destinationDomainID,
            resourceID,
            ethers.hexlify(depositData),
            ethers.zeroPadValue(ethers.toBeHex(0), 32)
        ]);
        
        return depositFee
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await provider.destroy();
    }
}

exports.deposit = async (options) => {
    const { sender, amount, recipient } = options;
    const provider = new JsonRpcProvider(bscProvider);
    try {
        const BRIDGE_CONTRACT = "0xC29eD21F4360A8Ce3AB28DdE6A55017C5a38178B";
        const BRIDGE_ABI = [
            {
                "inputs": [
                    {
                        "internalType": "uint8",
                        "name": "destinationDomainID",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "resourceID",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes",
                        "name": "depositData",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "feeData",
                        "type": "bytes"
                    }
                ],
                "name": "deposit",
                "outputs": [
                    {
                        "internalType": "uint64",
                        "name": "depositNonce",
                        "type": "uint64"
                    },
                    {
                        "internalType": "bytes",
                        "name": "handlerResponse",
                        "type": "bytes"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            }
        ]

        // Create a contract instance
        const contract = new Contract(BRIDGE_CONTRACT, BRIDGE_ABI, provider);
        
        const destinationDomainID = 1;
        const resourceID = 0x0000000000000000000000000000000000000000000000000000000000000000;
        // Decode the address to a public key
        const publicKey = decodeAddress(recipient);
        const publicKeyHex = u8aToHex(publicKey);
        // Convert amount to bytes and pad to 32 bytes
        const amountBytes = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
        
        // Convert recipient length to bytes and pad to 32 bytes
        const recipientLength = ethers.zeroPadValue(ethers.toBeHex(publicKey.length), 32);
        
        // Concatenate all parts into a single Uint8Array
        const depositData = ethers.concat([amountBytes, recipientLength, publicKeyHex]);

        const feeData = ethers.zeroPadValue(ethers.toBeHex(0), 32);

        const msgValue = parseEther("0.01"); // Example: Fee amount
        // Fetch the raw token balance
        const deposit = await contract.deposit(
            destinationDomainID,
            resourceID,
            depositData,
            feeData, 
            {
                value: msgValue, // Attach ETH for fee
            }
        );
        
        return deposit
    } catch (error) {
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    } finally {
        await provider.destroy();
    }
}

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
    try {
        const result = await Asset.list({
            limit: DEFAULT_QUERY_LIMIT, 
            offset: DEFAULT_QUERY_OFFSET, 
            condition: `asset_network_id=${2}`, 
            sortBy: "asset_id", 
            orderBy: "asc"
        })

        const assets = result.assets.map((asset) => ({
            id: asset.asset_native === 'y' ? null : asset.asset_id,
            icon: '',
            name: asset.asset_name,
            decimals: asset.asset_decimals.toString(),
            symbol: asset.asset_symbol,
            contract: asset.asset_contract
        }))

        return { assets: assets }
     } catch (error) {
         console.log(error)
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