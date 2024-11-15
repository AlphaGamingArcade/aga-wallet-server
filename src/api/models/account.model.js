const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");
const { passwordMatches } = require("./user.model");
const { decryptMnemonic } = require("../utils/hasher");

module.exports = class Account {
    static async save(options){
        const { userId, accountCode = "", status="a", mnemonic, password } = options
        const params = {
            tablename: "wallet_account",
            columns: ['account_user_id', 'account_code', 'account_status', 'account_mnemonic', 'account_password'],
            newValues: [userId, `'${accountCode}'`, `'${status}'`, `'${mnemonic}'`,`'${password}'`]
        };
        const { responseCode } = await SQLFunctions.insertQuery(params);
        if (responseCode === 0) {
            return {
                message: "Account created successfully"
            };
        }
        throw new APIError({
            message: 'Creating account failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    static checkUserHaveAccount(options){
        const { userId } = options;

        throw new APIError({
            message: 'Creating account failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    static async getById(id, extra = []) {
        let account;
        if (id) {
            const params = {
                tablename: "wallet_account", 
                columns: [...["account_id", "account_user_id", "account_account", "account_alias", "account_status", "account_address", "account_password"], ...extra], 
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

    static async getByAccountCode(accountCode, extra = []) {
        let account;
        if (accountCode) {
            const params = {
                tablename: "wallet_account", 
                columns: [...["account_id", "account_user_id", "account_code", "account_status"], ...extra], 
                condition: `account_code='${accountCode}'`
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


    static async getByAddress(address, extra = []) {
        let account;
        if (address) {
            const params = {
                tablename: "wallet_account", 
                columns: [...["account_id", "account_user_id", "account_code", "account_status", "account_address"], ...extra], 
                condition: `account_address='${address}'`
            };
            account = await SQLFunctions.selectQuery(params);
        }

        if(account.data){
            return account.data
        }

        throw new APIError({
            message: "Account not found",
            status: httpStatus.NOT_FOUND,
            isPublic: true,
        });
    }

    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "account_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "wallet_account", 
            columns: ["account_id", "account_user_id", "account_code", "account_status","account_address", "account_created_at", "account_updated_at"], 
            condition,
            sortBy,
            orderBy,
            limit,
            offset
        };

        const countParams = {
            tablename: "wallet_account", // Changed to the correct table name
            columns: ["COUNT(*) AS total"], 
            condition: condition
        };

        try {
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params),
            ]);

            const totalCount = result[0]?.data?.total || 0;
            const accounts = result[1]?.data || [];

            return {
                accounts,
                metadata: { count: totalCount }
            };
        } catch (error) {
            console.log(error)
            throw new APIError({
                message: "Error retrieving accounts",
                status: httpStatus.INTERNAL_SERVER_ERROR
            });
        }
    }

    static async decryptMnemonic(account, password){
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        
        if(await passwordMatches(password, account.account_password)){
            const phrase = decryptMnemonic(account.account_mnemonic, password);
            if (!phrase) {
                err.message = "Incorrect account password"
            }
            return phrase;
        } else {
            err.message = "Incorrect account password"
        }

        throw new APIError(err);
    }

    static checkDuplicate(error) {
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            let errorMessage = 'Account already exists'; // Default message

            if (error.message.includes('UQ_account_code')) {
                errorMessage = 'Account code already exists';
            } else if (error.message.includes('UQ_account_user_id')) {
                errorMessage = 'User already has an account';
            } else if (error.message.includes('UQ_account_mnemonic')) {
                errorMessage = 'Account mnemonic already exists';
            }
            return new APIError({
                message: errorMessage,
                status: httpStatus.CONFLICT,
                isPublic: true,
            });
        }
        return error;
    }
    
}
