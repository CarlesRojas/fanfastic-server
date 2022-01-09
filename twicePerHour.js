// Get the schemas
const User = require("./models/User");

const areSameDate = require("./utils/areSameDate");

const twicePerHour = async () => {
    console.log("Twice per hour job done");

    // Get all users
    const users = await User.find({});

    users.forEach(
        async ({ _id, timezoneOffsetInMs, hasWeeklyPass, isFasting, lastTimeUserStartedFasting, fastingStreak }) => {
            // Get local date and time of the user
            const userLocalTime = new Date();
            userLocalTime.setTime(userLocalTime.getTime() + timezoneOffsetInMs);
            const lastTimeUserFasted = new Date(lastTimeUserStartedFasting);

            const weekDay = userLocalTime.getUTCDay();
            const hour = userLocalTime.getUTCHours();
            const minute = userLocalTime.getUTCMinutes();

            // Time since user started fasting the last time
            const timeSinceUserStartedFastingInMs = Math.abs(userLocalTime - lastTimeUserFasted);
            const timeSinceUserStartedFastingInMinutes = Math.ceil(timeSinceUserStartedFastingInMs / 1000 / 60);

            // If it is the first half hour of monday -> Reset weekly pass
            const resetWeeklyPass = !hasWeeklyPass && weekDay === 1 && hour === 0 && minute >= 0 && minute < 30;

            // If it has been more than 23 hours since user started fasting, cancel the fasting session
            const cancelFasting = isFasting && timeSinceUserStartedFastingInMinutes > 23 * 60;

            var dayAfterTomorrowFromLastDayUserStartedFasting = new Date(lastTimeUserFasted);
            dayAfterTomorrowFromLastDayUserStartedFasting.setDate(
                dayAfterTomorrowFromLastDayUserStartedFasting.getDate() + 2
            );

            // Reset streak
            const resetStreak =
                fastingStreak > 0 && areSameDate(dayAfterTomorrowFromLastDayUserStartedFasting, userLocalTime);

            // Update User
            if (resetWeeklyPass || cancelFasting || resetStreak)
                await User.findOneAndUpdate(
                    { _id },
                    {
                        $set: {
                            hasWeeklyPass: resetWeeklyPass ? true : hasWeeklyPass,
                            isFasting: cancelFasting ? false : isFasting,
                            fastingStreak: resetStreak || cancelFasting ? 0 : fastingStreak,
                        },
                    }
                );
        }
    );
};

module.exports = twicePerHour;
