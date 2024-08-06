const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions")
const bcrypt = require('bcryptjs');
const { passwordMatches } = require("./user.model");

const STATUS_ACTIVE = 'a'
const STATUS_SUSPENDED = 's'

exports.getWalletByAddress = async (address) => {
    let wallet;

    if(address){
        const params = {
            tablename: "blockchain_wallet", 
            columns: ["wallet_id", "wallet_user_id", "wallet_account", "wallet_alias", "wallet_status", "wallet_address"], 
            condition: `wallet_address='${address}'`
        }
        wallet = await SQLFunctions.selectQuery(params);
    }

    if(wallet.data){
        return wallet.data
    }

    throw new APIError({
        message: 'Wallet does not exist',
        status: httpStatus.NOT_FOUND,
    });
}

exports.walletPasswordMatches = async (password, hashPassword) => {
    return bcrypt.compare(password, hashPassword);
}

exports.getUserWallet = async (options) => {
    const { senderAddress, password, userId } = options;
    let wallet;
    if(userId){
        const params = {
            tablename: "blockchain_wallet", 
            columns: ["wallet_id", "wallet_user_id", "wallet_account", "wallet_alias","wallet_status", "wallet_address", "wallet_password"], 
            condition: `wallet_user_id='${userId}' AND wallet_address='${senderAddress}'`
        }
        wallet = await SQLFunctions.selectQuery(params);
    }

    const err = {
        status: httpStatus.UNAUTHORIZED,
        isPublic: true
    };

    if(password){
        if(wallet.data && await this.walletPasswordMatches(password, wallet.data.wallet_password)){
            return wallet.data
        }
        err.message = 'Incorrect wallet password';
    } else {
        err.message =  "Wallet not found"
    }

    throw new APIError(err);
}

exports.getWalletMnemonic = async (options) => {
    const { walletAddress, walletPassword } = options;
    
    let wallet;
    if(walletAddress){
        const params = {
            tablename: "blockchain_wallet", 
            columns: ["wallet_id", "wallet_user_id", "wallet_account", "wallet_alias","wallet_status","wallet_mnemonic", "wallet_address", "wallet_password"], 
            condition: `wallet_address='${walletAddress}'`
        }
        wallet = await SQLFunctions.selectQuery(params);
    }

    const err = {
        status: httpStatus.INTERNAL_SERVER_ERROR,
    }

    if(wallet.data){
       if(passwordMatches(wallet.data.wallet_password, walletPassword)){
          return wallet.data.wallet_mnemonic
       }
       err.status = httpStatus.UNAUTHORIZED
       err.message = "Incorrect wallet password."
    } else {
        err.message =  "Error retrieving wallet by address"
    }

    throw new APIError(err);
}

exports.saveWallet = async (wallet) => {
    const { userId, walletAccount, walletAlias, walletStatus, walletMnemonic, walletAddress, walletPassword } = wallet;
    const params = {
        tablename: "blockchain_wallet",
        columns: ['wallet_user_id', 'wallet_account', 'wallet_alias', 'wallet_status', 'wallet_mnemonic', 'wallet_address', 'wallet_password'],
        newValues: [ userId, `'${walletAccount}'`, `'${walletAlias}'`, `'${walletStatus}'`, `'${walletMnemonic}'`,`'${walletAddress}'`, `'${walletPassword}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);
    if(responseCode == 0){
        return { 
            user_id: userId, 
            wallet_account: walletAccount, 
            wallet_alias: walletAlias, 
            wallet_status: walletStatus, 
            wallet_mnemonic: walletMnemonic,
            wallet_address: walletAddress
        }
    }

    throw new APIError({
        message: 'Creating wallet failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
}

exports.checkDuplicateWallet = (error) =>{
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
        return new APIError({
            message: 'Account already exist',
            status: httpStatus.CONFLICT,
            isPublic: true
          });
    }
    return error;
}

exports.getWalletsByUserId = async (options) => {
    const { userId, limit, offset, orderBy = "wallet_id" } = options;
    let wallets, totalCount;
    if(userId){
        const countParams = {
            tablename: "blockchain_wallet", 
            columns: ["COUNT(*) AS total"], 
            condition: `wallet_user_id=${userId}`
        };

        const params = {
            tablename: "blockchain_wallet", 
            columns: ["wallet_id", "wallet_user_id", "wallet_account", "wallet_alias", "wallet_status", "wallet_address"], 
            condition: `wallet_user_id=${userId}`,
            limit,
            offset,
            orderBy
        }
    
        const result = await Promise.all([
            SQLFunctions.selectQuery(countParams),
            SQLFunctions.selectQueryMultiple(params)
        ])

        totalCount = result[0]
        wallets = result[1]
    }

    const err = {
        status: httpStatus.INTERNAL_SERVER_ERROR,
        isPublic: true
    };

    if(wallets.data && totalCount.data){
        if(wallets.data.length > 0){
            return {
                wallets: wallets.data,
                metadata: {
                    count: totalCount.data.total
                }
            }
        }
        err.status = httpStatus.NOT_FOUND
        err.message = 'No wallets found';
    } else {
        err.message =  "Error retrieving user wallets"
    }

    throw new APIError(err);
}

exports.STATUS_ACTIVE = STATUS_ACTIVE;
exports.STATUS_SUSPENDED = STATUS_SUSPENDED;