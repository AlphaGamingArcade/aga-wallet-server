const httpStatus = require("http-status");
const APIError = require("../errors/api-error");
const SQLFunctions = require("../utils/sqlFunctions");

module.exports = class Notification {
    static async list(options){
        const { limit, offset, condition = "1=1", sortBy = "tx_id", orderBy = "asc" } = options;
        
        const params = {
            tablename: "blockchain_notification", 
            columns: ["notification_id", "notification_user_id", "notification_type", "notification_message", "notification_status", "notification_created_at", "notification_updated_at"], 
            condition,
            sortBy,
            orderBy,
            limit,
            offset
        };

        const countParams = {
            tablename: "blockchain_notification", // Changed to the correct table name
            columns: ["COUNT(*) AS total"], 
            condition: condition
        };

        try {
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params),
            ]);

            const totalCount = result[0]?.data?.total || 0;
            const notifications = result[1]?.data || [];

            return {
                notifications: notifications,
                metadata: { count: totalCount }
            };
        } catch (error) {
            const err = {
                message: "Error retrieving transactions",
                status: httpStatus.INTERNAL_SERVER_ERROR
            };
            throw new APIError(err);
        }
    }

    static async getByUserId(options) {
        const { userId, limit, offset, sortBy = "notification_id", orderBy = "asc" } = options;
        let notifications, totalCount, totalUnread;
        
        if (userId) {
            const unreadCountParams = {
                tablename: "blockchain_notification", 
                columns: ["COUNT(*) AS total"], 
                condition: `notification_user_id=${userId} AND notification_status = 'unread'`
            };

            const countParams = {
                tablename: "blockchain_notification", 
                columns: ["COUNT(*) AS total"], 
                condition: `notification_user_id=${userId}`
            };
        
            const params = {
                tablename: "blockchain_notification", 
                columns: [
                    "notification_id", "notification_user_id", 
                    "notification_type", "notification_message", 
                    "notification_status", "notification_created_at"
                ], 
                condition: `notification_user_id=${userId}`,
                limit, 
                offset, 
                sortBy,
                orderBy
            };
        
            const result = await Promise.all([
                SQLFunctions.selectQuery(countParams),
                SQLFunctions.selectQueryMultiple(params),
                SQLFunctions.selectQuery(unreadCountParams),
            ]);
        
            totalCount = result[0];
            notifications = result[1];
            totalUnread = result[2];
        }

        const err = {
            message: "Error retrieving notifications",
            status: httpStatus.INTERNAL_SERVER_ERROR
        }

        if (notifications?.data?.length > 0 && totalCount?.data) {
            return {
                notifications: notifications.data,
                metadata: { count: totalCount.data.total, unread: totalUnread.data.total }
            };
        } else {
            err.message = "No notifications found",
            err.status = httpStatus.NOT_FOUND
        }

        throw new APIError(err);
    }
    
    static async getNotificationById(notificationId) {
        if (!notificationId) {
            throw new APIError({
                message: 'Notification ID is required',
                status: httpStatus.BAD_REQUEST
            });
        }

        const params = {
            tablename: "blockchain_notification", 
            columns: [
                "notification_id", "notification_user_id", 
                "notification_type", "notification_message", 
                "notification_status", "notification_created_at", 
                "notification_updated_at"
            ], 
            condition: `notification_id=${notificationId}`
        };
        
        const notification = await SQLFunctions.selectQuery(params);

        if (notification.data) {
            return notification.data;
        }

        throw new APIError({
            message: 'Notification does not exist',
            status: httpStatus.NOT_FOUND
        });
    }

    static async getNotifications(options) {
        const { limit, offset, sortBy = "notification_id" } = options;
        
        const countParams = {
            tablename: "blockchain_notification", 
            columns: ["COUNT(*) AS total"], 
            condition: `1=1`
        };
    
        const params = {
            tablename: "blockchain_notification", 
            columns: [
                "notification_id", "notification_user_id", 
                "notification_type", "notification_message", 
                "notification_status", "notification_created_at"
            ], 
            condition: `1=1`,
            limit, 
            offset, 
            sortBy
        };
    
        const result = await Promise.all([
            SQLFunctions.selectQuery(countParams),
            SQLFunctions.selectQueryMultiple(params)
        ]);
    
        const totalCount = result[0];
        const notifications = result[1];

        if (notifications?.data?.length > 0 && totalCount?.data) {
            return {
                notifications: notifications.data,
                metadata: { count: totalCount.data.total }
            };
        }

        throw new APIError({
            message: notifications?.data?.length === 0 ? "No notifications found" : "Error retrieving notifications",
            status: notifications?.data?.length === 0 ? httpStatus.NOT_FOUND : httpStatus.BAD_REQUEST
        });
    }

    static async delete(options) {
        const { id } = options;

        const params = {
            tablename: "blockchain_notification", 
            condition: `notification_id=${id}`
        };
    
        const { responseCode } = await SQLFunctions.deleteQuery(params);
    
        if (responseCode === 0) {
            return { message: "Success removing notification" };
        }
        
        throw new APIError({
            message: 'Failed removing notification',
            status: httpStatus.INTERNAL_SERVER_ERROR
        });
    }

    static async update(options) {
        const { id, userId, type, message, status } = options;

        const params = {
            tablename: "blockchain_notification",
            newValues: [
                `notification_user_id='${userId}'`,
                `notification_type='${type}'`, 
                `notification_message='${message}'`, 
                `notification_status='${status}'`
            ],
            condition: `notification_id='${id}'`
        };
    
        const { responseCode, updatedRecord } = await SQLFunctions.updateQuery(params);
    
        if (responseCode === 0) {
            return updatedRecord;
        }
        
        throw new APIError({
            message: 'Failed updating notification',
            status: httpStatus.INTERNAL_SERVER_ERROR
        });
    }

    static async updateStatus(options) {
        const { id, status } = options;

        const params = {
            tablename: "blockchain_notification",
            newValues: [
                `notification_status='${status}'`
            ],
            condition: `notification_id='${id}'`
        };
    
        const { responseCode, updatedRecord } = await SQLFunctions.updateQuery(params);
    
        if (responseCode === 0) {
            return updatedRecord;
        }
        
        throw new APIError({
            message: 'Failed updating notification',
            status: httpStatus.INTERNAL_SERVER_ERROR
        });
    }
}

