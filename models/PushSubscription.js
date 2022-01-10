const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
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
    startFastingNotificationSentToday: {
        type: Boolean,
        required: true,
        default: false,
    },
    stopFastingNotificationSentToday: {
        type: Boolean,
        required: true,
        default: false,
    },
});

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
