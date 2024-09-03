const admin = require("../../config/firebase"); // Assuming this is your Firebase Admin instance
const Messaging = require("../models/messaging.model");

// Middleware to extend res with cloud messaging method
exports.cloudMessaging = (req, res, next) => {
  res.cloudMessaging = async (options = {}) => {
    try {
      const notification = {
        data: options.data,
        notification: options.notification,
        token: options.token || null,  // Set the FCM token from options
        topic: options.topic || null,  // Optional: Set a topic if provided
        condition: options.condition || null  // Optional: Set a condition if provided
      };

      // Send the notification using Firebase Cloud Messaging
      const response = await admin.messaging().send(notification);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  next();
};

// Middleware to handle cloud messaging
const handleCloudMessaging = async (req, res, next) => {
  try {
    const messaging = await Messaging.getByUserId(req.user.user_id);
    req.messaging = messaging;
    return next();
  } catch (err) {
    // Ignore if messaging not found
    req.messaging = {};
    return next();
  }
};

// Middleware to authorize cloud messaging
exports.authorizeCloudMessaging = () => (req, res, next) => {
  handleCloudMessaging(req, res, next);
};
