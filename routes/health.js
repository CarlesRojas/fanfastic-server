// Get express Router
const router = require("express").Router();

// Object id type
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Token verification
const verify = require("./verifyToken");

// Dot env constants
const dotenv = require("dotenv");
dotenv.config();

// Get the Validation schemas
const { setHeightValidation, setWeightValidation, setWeightObjectiveValidation } = require("../validation");

// Get the schemes
const User = require("../models/User");
const HealthEntry = require("../models/HealthEntry");

router.post("/setHeight", verify, async (request, response) => {
    // Validate data
    const { error } = setHeightValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { heightInCm } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Update User
        const newUser = await User.findOneAndUpdate({ _id }, { $set: { heightInCm } }, { new: true });

        response.status(200).json(newUser);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/setWeight", verify, async (request, response) => {
    // Validate data
    const { error } = setWeightValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { weightInKg, date, timezoneOffsetInMs } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        const { heightInCm, startingWeightObjectiveInKg } = user;

        // Get local date of the user
        const userLocalTime = new Date(date);
        userLocalTime.setTime(userLocalTime.getTime() + timezoneOffsetInMs);

        const day = userLocalTime.getUTCDate();
        const month = userLocalTime.getUTCMonth() + 1;
        const year = userLocalTime.getUTCFullYear();

        const entries = await HealthEntry.aggregate([
            {
                $addFields: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" },
                },
            },
            { $match: { userId: ObjectId(_id), year, month, day } },
        ]);

        // Only one weight per day
        if (entries.length > 0) return response.status(404).json({ error: "You already registered your weight today" });

        // Create entry for health
        const healthEntry = new HealthEntry({
            userId: _id,
            heightInCm,
            weightInKg,
            date: userLocalTime,
        });

        // Save user to DB
        await healthEntry.save();

        // Update User
        const newUser = await User.findOneAndUpdate(
            { _id },
            {
                $set: {
                    weightInKg,
                    startingWeightObjectiveInKg:
                        weightInKg > startingWeightObjectiveInKg && startingWeightObjectiveInKg >= 0
                            ? weightInKg
                            : startingWeightObjectiveInKg,
                    lastTimeUserEnteredWeight: userLocalTime,
                },
            },
            { new: true }
        );

        response.status(200).json(newUser);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/setWeightObjective", verify, async (request, response) => {
    // Validate data
    const { error } = setWeightObjectiveValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { weightObjectiveInKg } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        const { weightInKg } = user;

        if (weightObjectiveInKg > weightInKg)
            return response.status(404).json({ error: "You already reached this objective" });

        // Update User
        const newUser = await User.findOneAndUpdate(
            { _id },
            {
                $set: {
                    startingWeightObjectiveInKg: weightObjectiveInKg < 0 ? weightObjectiveInKg : weightInKg,
                    weightObjectiveInKg,
                },
            },
            { new: true }
        );

        response.status(200).json(newUser);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.get("/getWeightHistoric", verify, async (request, response) => {
    try {
        // Deconstruct request
        const { _id } = request;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });
        // Get all entries for user
        const entries = await HealthEntry.aggregate([{ $match: { userId: ObjectId(_id) } }]);

        response.status(200).json({ weightHistoric: entries });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

module.exports = router;
