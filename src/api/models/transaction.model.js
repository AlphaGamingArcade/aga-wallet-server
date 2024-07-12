const httpStatus = require("http-status");
const SQLFunctions = require("../utils/sqlFunctions");
const APIError = require("../errors/api-error");

const STATUS_PENDING = 'p'
const STATUS_FAILED = 'f'
const STATUS_SUCCESS = 's'

exports.getTransactionById = async (id) => {
    let transaction;

    if(id){
        const params = {
            tablename: "blockchain_transaction", 
            columns: ["tx_id, tx_wallet_sender_address, tx_wallet_recipient_address, tx_amount, tx_status, tx_created_at, tx_updated_at"], 
            condition: `tx_id=${id}`
        }
        transaction = await SQLFunctions.selectQuery(params);
    }

    if(transaction.data){
        return transaction.data
    }

    throw new APIError({
        message: 'Transaction does not exist',
        status: httpStatus.NOT_FOUND,
    });
}

exports.saveTransaction = async (transaction) => {
    const { senderAddress, recipientAddress, amount, status, hash } = transaction;
    const params = {
        tablename: "blockchain_transaction",
        columns: ["tx_wallet_sender_address, tx_wallet_recipient_address, tx_amount, tx_hash, tx_status"],
        newValues: [`'${senderAddress}'`, `'${recipientAddress}'`, amount, `'${hash}'`,`'${status}'`]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);
    
    if(responseCode == 0){
        return {
            senderAddress, 
            recipientAddress, 
            amount,
            status,
            hash
        }
    }

    throw new APIError({
        message: 'Creating transaction failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
    });
}

exports.checkDuplicateTransaction = (error) =>{
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
        return new APIError({
            message: 'Transaction already exist',
            status: httpStatus.CONFLICT,
            isPublic: true
          });
    }
    return error;
}

exports.STATUS_PENDING = STATUS_PENDING
exports.STATUS_FAILED = STATUS_FAILED
exports.STATUS_SUCCESS = STATUS_SUCCESS