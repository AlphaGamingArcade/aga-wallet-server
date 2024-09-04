const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

module.exports = class Account {
    static async save(options){
        const { userId, code = "", status="a", mnemonic, address, password } = options
        const params = {
            tablename: "wallet_account",
            columns: ['account_user_id', 'account_code', 'account_status', 'account_mnemonic', 'account_address', 'account_password'],
            newValues: [userId, `'${code}'`, `'${status}'`, `'${mnemonic}'`, `'${address}'`,`'${password}'`]
        };
        const { responseCode } = await SQLFunctions.insertQuery(params);
        if (responseCode === 0) {
            return {
                message: "Account created successfully"
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
                tablename: "wallet_account", 
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

    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "account_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "wallet_account", 
            columns: ["account_id", "account_user_id", "account_code", "account_status", "account_address", "account_created_at", "account_updated_at"], 
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
            const err = {
                message: "Error retrieving accounts",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
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
