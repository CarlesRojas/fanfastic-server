// Get express Router
const router = require("express").Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Token verification
const verify = require("./verifyToken");

// Dot env constants
const dotenv = require("dotenv");
dotenv.config();

// Get the Validation schemas
const {
    setFastDesiredStartTimeValidation,
    setFastObjectiveValidation,
    userDateTimeValidation,
    getMonthFastEntriesValidation,
} = require("../validation");

// Get the schemes
const User = require("../models/User");
const FastEntry = require("../models/FastEntry");

router.get("/getUserInfo", verify, async (request, response) => {
    try {
        // Deconstruct request
        const { _id } = request;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        response.status(200).json(user);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/setFastDesiredStartTime", verify, async (request, response) => {
    // Validate data
    const { error } = setFastDesiredStartTimeValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { fastDesiredStartTimeInMinutes } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Update User
        await User.findOneAndUpdate({ _id }, { $set: { fastDesiredStartTimeInMinutes } });

        response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/setFastObjective", verify, async (request, response) => {
    // Validate data
    const { error } = setFastObjectiveValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { fastObjectiveInMinutes } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Update User
        await User.findOneAndUpdate({ _id }, { $set: { fastObjectiveInMinutes } });

        response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/startFasting", verify, async (request, response) => {
    // Validate data
    const { error } = userDateTimeValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { date, timezoneOffsetInMs } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Get local date of the user
        const localFastStartDate = new Date(date);
        localFastStartDate.setTime(localFastStartDate.getTime() + timezoneOffsetInMs);

        const { isFasting, lastTimeUserStartedFasting } = user;
        const localLastTimeUserStartedFasting = new Date(lastTimeUserStartedFasting);

        if (isFasting) return response.status(409).json({ error: "User already fasting" });

        // If the user already fasted today
        if (
            localFastStartDate.getUTCFullYear() === localLastTimeUserStartedFasting.getUTCFullYear() &&
            localFastStartDate.getUTCMonth() === localLastTimeUserStartedFasting.getUTCMonth() &&
            localFastStartDate.getUTCDate() === localLastTimeUserStartedFasting.getUTCDate()
        )
            return response.status(409).json({ error: "User already fasted today" });

        // Update User
        await User.findOneAndUpdate(
            { _id },
            { $set: { isFasting: true, lastTimeUserStartedFasting: localFastStartDate, timezoneOffsetInMs } }
        );

        response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/stopFasting", verify, async (request, response) => {
    // Validate data
    const { error } = userDateTimeValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { date, timezoneOffsetInMs } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Get local date of the user
        const localFastEndDate = new Date(date);
        localFastEndDate.setTime(localFastEndDate.getTime() + timezoneOffsetInMs);

        const { isFasting, fastObjectiveInMinutes, lastTimeUserStartedFasting } = user;

        if (!isFasting) return response.status(409).json({ error: "User is not fasting" });

        // Update User
        await User.findOneAndUpdate({ _id }, { $set: { isFasting: false, timezoneOffsetInMs } });

        // Fasting duration
        const startDate = new Date(lastTimeUserStartedFasting);
        const fastDurationInMilliseconds = Math.abs(localFastEndDate - startDate);
        const fastDurationInMinutes = Math.ceil(fastDurationInMilliseconds / 1000 / 60);

        // Create entry for fast
        const fastEntry = new FastEntry({
            userId: _id,
            fastDurationInMinutes,
            fastObjectiveInMinutes,
            fastStartDate: lastTimeUserStartedFasting,
            fastEndDate: localFastEndDate,
            usedWeeklyPass: false,
        });

        // Save user to DB
        await fastEntry.save();

        response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/useWeeklyPass", verify, async (request, response) => {
    // Validate data
    const { error } = userDateTimeValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { date, timezoneOffsetInMs } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Get local date of the user
        const localUseWeeklyPassDate = new Date(date);
        localUseWeeklyPassDate.setTime(localUseWeeklyPassDate.getTime() + timezoneOffsetInMs);

        const { isFasting, hasWeeklyPass, fastObjectiveInMinutes, lastTimeUserStartedFasting } = user;

        // If already fasted today -> can't use token
        const lastFastDate = new Date(lastTimeUserStartedFasting);
        if (
            localUseWeeklyPassDate.getUTCFullYear() === lastFastDate.getUTCFullYear() &&
            localUseWeeklyPassDate.getUTCMonth() === lastFastDate.getUTCMonth() &&
            localUseWeeklyPassDate.getUTCDate() === lastFastDate.getUTCDate()
        )
            return response.status(409).json({ error: "User already fasted today" });

        if (isFasting) return response.status(409).json({ error: "Cant use pass when user is fasting" });
        if (!hasWeeklyPass) return response.status(409).json({ error: "User already used the weekly pass" });

        // Update User
        await User.findOneAndUpdate(
            { _id },
            { $set: { hasWeeklyPass: false, lastTimeUserStartedFasting: localUseWeeklyPassDate, timezoneOffsetInMs } }
        );

        // Create entry for fast
        const fastEntry = new FastEntry({
            userId: _id,
            fastDurationInMinutes: 0,
            fastObjectiveInMinutes,
            fastStartDate: localUseWeeklyPassDate,
            fastEndDate: localUseWeeklyPassDate,
            usedWeeklyPass: true,
        });

        // Save user to DB
        await fastEntry.save();

        response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/getMonthFastEntries", verify, async (request, response) => {
    // Validate data
    const { error } = getMonthFastEntriesValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { month, year } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        const entries = await FastEntry.aggregate([
            {
                $addFields: {
                    month: { $month: "$fastStartDate" },
                    year: { $year: "$fastStartDate" },
                },
            },
            { $match: { month, year, userId: ObjectId(_id) } },
            { $sort: { fastStartDate: 1 } },
        ]);

        // Treat data
        var responseArray = [];
        const numDaysInMonth = new Date(year, month, 0).getDate();
        var entriesIndex = 0;
        for (let i = 0; i < numDaysInMonth; i++) {
            if (entriesIndex >= entries.length) {
                responseArray.push(null);
                continue;
            }

            // Get current entry
            const { fastDurationInMinutes, fastObjectiveInMinutes, fastStartDate, usedWeeklyPass } =
                entries[entriesIndex];

            // Get day of the entry
            const entryDate = new Date(fastStartDate);
            const entryDay = entryDate.getUTCDate();

            // If entry matches this day -> Push info and go to next entry
            if (entryDay === i + 1) {
                responseArray.push({ fastDurationInMinutes, fastObjectiveInMinutes, usedWeeklyPass });
                entriesIndex++;
            }

            // Otherwise -> Push null and go to the next day
            else responseArray.push(null);
        }

        response.status(200).json({ responseArray });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

module.exports = router;
