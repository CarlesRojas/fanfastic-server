const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 3,
        max: 12,
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 256,
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024,
    },
    fastDesiredStartTimeInMinutes: {
        type: Number,
        required: true,
        min: 0,
        max: 24 * 60 - 1,
        default: 21 * 60,
    },
    fastObjectiveInMinutes: {
        type: Number,
        required: true,
        min: 0,
        max: 24 * 60 - 1,
        default: 14 * 60,
    },
    lastTimeUserStartedFasting: {
        type: Date,
        required: true,
        default: Date.now,
    },
    isFasting: {
        type: Boolean,
        required: true,
        default: false,
    },
    hasWeeklyPass: {
        type: Boolean,
        required: true,
        default: true,
    },
    timezoneOffsetInMs: {
        type: Number,
        required: true,
        default: 0,
    },
});

module.exports = mongoose.model("User", userSchema);
