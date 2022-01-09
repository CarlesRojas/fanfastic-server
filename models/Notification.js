const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId,
        required: true,
        min: 3,
        max: 12,
    },
    subscription: {
        endpoint: {
            type: String,
            unique: true,
            required: true,
        },
        expirationTime: {
            type: Number,
            required: false,
        },
        keys: {
            auth: String,
            p256dh: String,
        },
    },
});

module.exports = mongoose.model("Notification", notificationSchema);
