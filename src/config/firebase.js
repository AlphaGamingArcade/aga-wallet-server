const admin = require("firebase-admin");
const serviceAccount = require("../../auth-with-80282-firebase-adminsdk-hqhy1-8d0aef985e.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = admin