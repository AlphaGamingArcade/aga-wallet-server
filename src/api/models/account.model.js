const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");
const bcrypt = require('bcryptjs');
const { passwordMatches } = require("./user.model");

const CryptoJS = require('crypto-js');

module.exports = class Account {
    // ENCRYPTION AND DECRYPTION
    static encryptMnemonic(mnemonic, password) {
        return CryptoJS.AES.encrypt(mnemonic, password).toString();
    }
    static decryptMnemonic(encryptedMnemonic, password) {
        const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    static async save(options){
        const { userId, alias = "", status="a", mnemonic, address, password } = options
        const params = {
            tablename: "blockchain_wallet",
            columns: ['wallet_user_id', 'wallet_account', 'wallet_alias', 'wallet_status', 'wallet_mnemonic', 'wallet_address', 'wallet_password'],
            newValues: [userId, `'${walletAccount}'`, `'${walletAlias}'`, `'${walletStatus}'`, `'${walletMnemonic}'`,`'${walletAddress}'`, `'${walletPassword}'`]
        };
        const { responseCode } = await SQLFunctions.insertQuery(params);
        if (responseCode === 0) {
            return {
                user_id: userId,
                wallet_account: walletAccount, 
                wallet_alias: walletAlias, 
                wallet_status: walletStatus, 
                wallet_mnemonic: walletMnemonic,
                wallet_address: walletAddress
            };
        }
    
        throw new APIError({
            message: 'Creating wallet failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });

    }

    static async getById(id) {
        let account;
        if (id) {
            const params = {
                tablename: "blockchain_account", 
                columns: ["account_id", "account_user_id", "account_account", "account_alias", "account_status", "account_address", "account_password"], 
                condition: `account_id=${id}`
            };
            account = await SQLFunctions.selectQuery(params);
        }

        if(account.data){
            return account.data
        }

        throw new APIError({
            status: httpStatus.NOT_FOUND,
            isPublic: true,
        });
    }

    static checkDuplicate(error) {
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            return new APIError({
                message: 'Account already exists',
                status: httpStatus.CONFLICT,
                isPublic: true,
            });
        }
        return error;
    }
}
