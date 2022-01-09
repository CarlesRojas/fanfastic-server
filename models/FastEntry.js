const mongoose = require("mongoose");

const fastEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId,
        required: true,
        min: 3,
        max: 12,
    },
    fastDurationInMinutes: {
        type: Number,
        required: true,
        min: 0,
        max: 24 * 60 - 1,
        default: 14 * 60,
    },
    fastObjectiveInMinutes: {
        type: Number,
        required: true,
        required: true,
        min: 0,
        max: 24 * 60 - 1,
        default: 14 * 60,
    },
    fastStartDate: {
        type: Date,
        required: true,
    },
    fastEndDate: {
        type: Date,
        required: true,
    },
    usedWeeklyPass: {
        type: Boolean,
        required: true,
        default: false,
    },
});

module.exports = mongoose.model("FastEntry", fastEntrySchema);
