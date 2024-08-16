const httpStatus = require("http-status");
const SQLFunctions = require("../utils/sqlFunctions");
const APIError = require("../errors/api-error");

class Transaction {
    static STATUS_PENDING = 'p';
    static STATUS_FAILED = 'f';
    static STATUS_SUCCESS = 's';

    static async getTransactionById(id) {
        let transaction;
        if (id) {
            const params = {
                tablename: "blockchain_transaction", 
                columns: ["tx_id", "tx_wallet_sender_address", "tx_wallet_recipient_address", "tx_amount", "tx_status", "tx_created_at", "tx_updated_at"], 
                condition: `tx_id=${id}`
            };
            transaction = await SQLFunctions.selectQuery(params);
        }
    
        if (transaction?.data) {
            return transaction.data;
        }
    
        throw new APIError({
            message: 'Transaction does not exist',
            status: httpStatus.NOT_FOUND,
        });
    }

    static async save(transaction) {
        const { senderAddress, recipientAddress, amount, status, txHash, blockHash } = transaction;
        const params = {
            tablename: 'blockchain_transaction',
            columns: ['tx_wallet_sender_address', 'tx_wallet_recipient_address', 'tx_amount', 'tx_hash', 'tx_type', 'tx_block_hash', 'tx_status'],
            multipleValues: [
              [`'${senderAddress}'`, `'${recipientAddress}'`, amount, `'${txHash}'`,`'t'`, `'${blockHash}'`, `'${status}'`], // TRANSFER
              [`'${recipientAddress}'`, `'${senderAddress}'`, amount, `'${txHash}'`,`'r'`, `'${blockHash}'`, `'${status}'`] // RECEIVE
            ]
        };
        const { responseCode } = await SQLFunctions.insertQueryMultiple(params);
        
        if (responseCode === 0) {
            return {
                senderAddress, 
                recipientAddress, 
                amount,
                status,
                txHash,
                blockHash
            };
        }
    
        throw new APIError({
            message: 'Creating transaction failed',
            status: httpStatus.INTERNAL_SERVER_ERROR,
        });
    }

    static async getBySenderAddr(options) {
        const { address, limit, offset, orderBy = "tx_id" } = options;
        let transactions, totalCount;
        const err = { message: 'Error retrieving transactions' };

        if (address) {
            const countParams = {
                tablename: "blockchain_transaction", 
                columns: ["COUNT(*) AS total"], 
                condition: `tx_wallet_sender_address='${address}'`
            };

            const params = {
                tablename: "blockchain_transaction", 
                columns: ["tx_id", "tx_wallet_sender_address", "tx_wallet_recipient_address", "tx_amount", "tx_status", "tx_hash", "tx_type", "tx_block_hash", "tx_created_at", "tx_updated_at"], 
                condition: `tx_wallet_sender_address='${address}'`,
                limit, 
                offset, 
                orderBy
            };

            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params)
            ]);

            totalCount = result[0];
            transactions = result[1];
        }

        if (transactions?.data && totalCount?.data) {
            if (transactions.data.length > 0) {
                return {
                    transactions: transactions.data,
                    metadata: { count: totalCount.data.total }
                };
            }
            err.message = "No transactions found";
            err.status = httpStatus.NOT_FOUND;
        } else {
            err.httpStatus = httpStatus.BAD_REQUEST;
        }

        throw new APIError(err);
    }

    static checkDuplicate(error) {
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            return new APIError({
                message: 'Transaction already exists',
                status: httpStatus.CONFLICT,
                isPublic: true
            });
        }
        return error;
    }

    static checkBalanceNotEnoughTransaction(error) {
        if (error.message.includes('{\"arithmetic\":\"Underflow\"')) {
            return new APIError({
                message: 'Balance not enough',
                status: httpStatus.BAD_REQUEST,
                isPublic: true
            });
        }
        return error;
    }
}

module.exports = Transaction;
