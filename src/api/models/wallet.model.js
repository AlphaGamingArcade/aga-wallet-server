const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions")

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

exports.STATUS_ACTIVE = STATUS_ACTIVE;
exports.STATUS_SUSPENDED = STATUS_SUSPENDED;