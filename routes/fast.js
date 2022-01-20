// Get express Router
const router = require("express").Router();

// Object id type
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const areSameDate = require("../utils/areSameDate");

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
        const newUser = await User.findOneAndUpdate(
            { _id },
            { $set: { fastDesiredStartTimeInMinutes } },
            { new: true }
        );

        response.status(200).json(newUser);
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
        const newUser = await User.findOneAndUpdate({ _id }, { $set: { fastObjectiveInMinutes } }, { new: true });

        response.status(200).json(newUser);
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

        if (isFasting) return response.status(409).json({ error: "You are already fasting" });

        // If the user already fasted today
        if (areSameDate(localFastStartDate, localLastTimeUserStartedFasting))
            return response.status(409).json({ error: "You already fasted today" });

        // Update User
        const newUser = await User.findOneAndUpdate(
            { _id },
            { $set: { isFasting: true, lastTimeUserStartedFasting: localFastStartDate, timezoneOffsetInMs } },
            { new: true }
        );

        response.status(200).json(newUser);
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

        const {
            isFasting,
            fastObjectiveInMinutes,
            lastTimeUserStartedFasting,
            fastingStreak,
            totalDaysUserReachedGoal,
        } = user;

        if (!isFasting) return response.status(409).json({ error: "You are not fasting" });

        // Fasting duration
        const startDate = new Date(lastTimeUserStartedFasting);
        const fastDurationInMilliseconds = Math.abs(localFastEndDate - startDate);
        const fastDurationInMinutes = Math.ceil(fastDurationInMilliseconds / 1000 / 60);

        if (localFastEndDate - startDate <= 0)
            return response.status(409).json({ error: "Invalid fasting entry. You finished before you started." });

        const reachedGoal = fastDurationInMinutes >= fastObjectiveInMinutes;

        // Create entry for fast
        const fastEntry = new FastEntry({
            userId: _id,
            fastDurationInMinutes,
            fastObjectiveInMinutes,
            fastStartDate: lastTimeUserStartedFasting,
            fastEndDate: localFastEndDate,
            usedWeeklyPass: false,
            reachedGoal,
        });

        // Save user to DB
        await fastEntry.save();

        // Update User
        const newUser = await User.findOneAndUpdate(
            { _id },
            {
                $set: {
                    isFasting: false,
                    lastTimeUserEndedFasting: localFastEndDate,
                    totalDaysUserReachedGoal: reachedGoal ? totalDaysUserReachedGoal + 1 : totalDaysUserReachedGoal,
                    fastingStreak: reachedGoal ? fastingStreak + 1 : 0,
                    timezoneOffsetInMs,
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

        const {
            isFasting,
            hasWeeklyPass,
            fastObjectiveInMinutes,
            lastTimeUserStartedFasting,
            fastingStreak,
            totalDaysUserReachedGoal,
        } = user;

        if (!hasWeeklyPass) return response.status(409).json({ error: "You already used the weekly pass" });
        const lastFastDate = new Date(lastTimeUserStartedFasting);

        var newUser = {};

        // If user is fasting -> Cancel fasting and use pass (User can fast today again if the fasting started yesterday)
        if (isFasting) {
            // Create entry for fast
            const fastEntry = new FastEntry({
                userId: _id,
                fastDurationInMinutes: 0,
                fastObjectiveInMinutes,
                fastStartDate: lastFastDate,
                fastEndDate: lastFastDate,
                usedWeeklyPass: true,
                reachedGoal: true,
            });

            // Save user to DB
            await fastEntry.save();

            // Update User
            newUser = await User.findOneAndUpdate(
                { _id },
                {
                    $set: {
                        isFasting: false,
                        hasWeeklyPass: false,
                        totalDaysUserReachedGoal: totalDaysUserReachedGoal + 1,
                        lastTimeUserUsedWeeklyPass: localUseWeeklyPassDate,
                        fastingStreak: fastingStreak + 1,
                        timezoneOffsetInMs,
                    },
                },
                { new: true }
            );
        }
        // Otherwise -> Cancel fasting and use pass (User cannot fast again today)
        else {
            // If already fasted today -> can't use token

            if (areSameDate(localUseWeeklyPassDate, lastFastDate))
                return response.status(409).json({ error: "You already fasted today" });

            // Create entry for fast
            const fastEntry = new FastEntry({
                userId: _id,
                fastDurationInMinutes: 0,
                fastObjectiveInMinutes,
                fastStartDate: localUseWeeklyPassDate,
                fastEndDate: localUseWeeklyPassDate,
                usedWeeklyPass: true,
                reachedGoal: true,
            });

            // Save user to DB
            await fastEntry.save();

            // Update User
            newUser = await User.findOneAndUpdate(
                { _id },
                {
                    $set: {
                        hasWeeklyPass: false,
                        lastTimeUserStartedFasting: localUseWeeklyPassDate,
                        lastTimeUserUsedWeeklyPass: localUseWeeklyPassDate,
                        totalDaysUserReachedGoal: totalDaysUserReachedGoal + 1,
                        fastingStreak: fastingStreak + 1,
                        timezoneOffsetInMs,
                    },
                },
                { new: true }
            );
        }

        response.status(200).json(newUser);
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

        response.status(200).json({ historic: responseArray });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

module.exports = router;
