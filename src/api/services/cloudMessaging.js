const admin = require("./../../config/firebase")
/**
 * e.g const message = {
        data: {score: '850', time: '2:45'},
        tokens: [],
    };
 * @param {*} param0 
 */
exports.getMessaging = async (message) => {
    console.log("Message",message)
    await admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
    });
}