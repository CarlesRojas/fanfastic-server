const mongoose = require("mongoose");

const healthEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId,
        required: true,
        min: 3,
        max: 12,
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
    date: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model("HealthEntry", healthEntrySchema);
