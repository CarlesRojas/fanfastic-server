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
        default: () => new Date(+new Date() - 7 * 24 * 60 * 60 * 1000),
    },
    lastTimeUserEndedFasting: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() - 7 * 24 * 60 * 60 * 1000),
    },
    lastTimeUserEnteredWeight: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() - 7 * 24 * 60 * 60 * 1000),
    },
    lastTimeUserUsedWeeklyPass: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() - 8 * 24 * 60 * 60 * 1000),
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
    heightInCm: {
        type: Number,
        required: true,
        default: 165,
        min: 0,
        max: 300,
    },
    weightInKg: {
        type: Number,
        required: true,
        default: 80.0,
        min: 0,
        max: 700,
    },
    startingWeightObjectiveInKg: {
        type: Number,
        required: true,
        default: -1,
        min: -1,
        max: 700,
    },
    veryFirstWeightInKg: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 700,
    },
    weightObjectiveInKg: {
        type: Number,
        required: true,
        default: -1,
        min: -1,
        max: 700,
    },
    fastingStreak: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    totalDaysUserReachedGoal: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
});

module.exports = mongoose.model("User", userSchema);
