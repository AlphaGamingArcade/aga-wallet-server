const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions")

exports.getNotificationsByUserId = async (options) => {
    const { userId, limit, offset, orderBy = "notification_id" } = options;
    let notifications, totalCount;
    const err = { message: 'Error retrieving notifications' }
    if(userId){
        const countParams = {
            tablename: "blockchain_notification", 
            columns: ["COUNT(*) AS total"], 
            condition: `notification_user_id=${userId}`
        };
    
        const params = {
            tablename: "blockchain_notification", 
            columns: ["notification_id","notification_user_id", "notification_type", "notification_message", "notification_status", "notification_created_at"], 
            condition: `notification_user_id=${userId}`,
            limit, 
            offset, 
            orderBy
        }
    
        const result = await Promise.all([
            SQLFunctions.selectQuery(countParams),
            SQLFunctions.selectQueryMultiple(params)
        ])
    
        totalCount = result[0]
        notifications = result[1]    
    }

    if(notifications.data && totalCount.data){
        if(notifications.data.length > 0){
            return {
                notifications: notifications.data,
                metadata: { count: totalCount.data.total }
            }
        }
        err.message = "No notifications found"
        err.status = httpStatus.NOT_FOUND
    } else {
        err.httpStatus = httpStatus.BAD_REQUEST
    }

    throw new APIError(err);
}
exports.getNotificationById = async (notificationId) => {
    let notification;
    if(notificationId){
        const params = {
            tablename: "blockchain_notification", 
            columns: ["notification_id", "notification_user_id", "notification_type", "notification_message", "notification_status", "notification_created_at", "notification_updated_at"], 
            condition: `notification_id=${notificationId}`
        }
        notification = await SQLFunctions.selectQuery(params);
    }

    if(notification.data){
        return notification.data
    }

    throw new APIError({
        message: 'Notification does not exist',
        status: httpStatus.NOT_FOUND,
    });
}
exports.getNotifications = async (options) => {
    const { limit, offset, orderBy = "notification_id" } = options;
    let notifications, totalCount;
    const err = { message: 'Error retrieving notifications' }
    
    const countParams = {
        tablename: "blockchain_notification", 
        columns: ["COUNT(*) AS total"], 
        condition: `1=1`
    };

    const params = {
        tablename: "blockchain_notification", 
        columns: ["notification_id","notification_user_id", "notification_type", "notification_message", "notification_status", "notification_created_at"], 
        condition: `1=1`,
        limit, 
        offset, 
        orderBy
    }

    const result = await Promise.all([
        SQLFunctions.selectQuery(countParams),
        SQLFunctions.selectQueryMultiple(params)
    ])

    totalCount = result[0]
    notifications = result[1]

    if(notifications.data && totalCount.data){
        if(notifications.data.length > 0){
            return {
                notifications: notifications.data,
                metadata: { count: totalCount.data.total }
            }
        }
        err.message = "No notifications found"
        err.status = httpStatus.NOT_FOUND
    } else {
        err.httpStatus = httpStatus.BAD_REQUEST
    }

    throw new APIError(err);
}