const httpStatus = require("http-status");
const SQLFunctions = require("../utils/sqlFunctions");
const APIError = require("../errors/api-error");

exports.getTransactionById = async (id) => {
    let transaction;

    if(id){
        const params = {
            tablename: "blockchain_transaction", 
            columns: ["tx_id, tx_user_id, tx_wallet_sender_address, tx_wallet_recipient_address, tx_amount, tx_status, tx_created_at, tx_updated_at"], 
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
    const { userId, senderAddress, recipientAddress, amount, status } = transaction;
    const params = {
        tablename: "blockchain_transaction",
        columns: ["tx_user_id, tx_wallet_sender_address, tx_wallet_recipient_address, tx_amount, tx_status"],
        newValues: [userId, senderAddress, recipientAddress, amount, status]
    }
    const { responseCode } = await SQLFunctions.insertQuery(params);
    
    if(responseCode == 0){
        return { 
            email, 
            name, 
            services, 
            role, 
            picture
        }
    }

    throw new APIError({
        message: 'Creating user failed',
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
