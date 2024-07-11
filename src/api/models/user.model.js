const httpStatus = require("http-status");
const SQLFunctions = require("../utils/sqlFunctions");
const APIError = require("../errors/api-error");

exports.getUserById = async (id) => {
    let user;

    if(id){
        const params = {
            tablename: "blockchain_user", 
            columns: ["user_id, email, name, services, role, picture"], 
            condition: `user_id=${id}`
        }
        user = await SQLFunctions.selectQuery(params);
    }

    if(user.data){
        return user.data
    }

    throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
    });
}

exports.saveUser = async (user) => {
    const { email, password, name, services, role, picture } = user;
    const params = {
        tablename: "blockchain_user",
        columns: ['email', 'password', 'name', 'services', 'role', 'picture'],
        newValues: [email, password, name, services, role, picture]
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

exports.checkDuplicateUser = (error) =>{
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
        return new APIError({
            message: 'Account already exist',
            status: httpStatus.CONFLICT,
            isPublic: true
          });
    }
    return error;
}
