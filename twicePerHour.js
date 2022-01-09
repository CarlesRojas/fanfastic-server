// Push notifications library
const webPush = require("web-push");

// Get the schemas
const User = require("./models/User");
const PushSubscription = require("./models/PushSubscription");

// Utils
const areSameDate = require("./utils/areSameDate");

const twicePerHour = async () => {
    // #################################################
    //   UPDATE USERS
    // #################################################

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

    // #################################################
    //   SEND PUSH NOTIFICATIONS
    // #################################################

    const pushSubscriptions = await PushSubscription.find({});

    for (const { userId, subscription } of pushSubscriptions) {
        // Get user
        const user = await User.findOne({ _id: userId });
        if (!user) continue;

        const {
            fastDesiredStartTimeInMinutes,
            fastObjectiveInMinutes,
            lastTimeUserStartedFasting,
            isFasting,
            timezoneOffsetInMs,
        } = user;

        // Get local date of the user
        const userLocalTime = new Date();
        userLocalTime.setTime(userLocalTime.getTime() + timezoneOffsetInMs);

        //   STOP FASTING NOTIFICATION
        // #################################################

        if (isFasting) {
            // Fasting current duration
            const startDate = new Date(lastTimeUserStartedFasting);
            const fastDurationInMilliseconds = Math.abs(userLocalTime - startDate);
            const fastDurationInMinutes = Math.ceil(fastDurationInMilliseconds / 1000 / 60);
            const reachedGoal = fastDurationInMinutes >= fastObjectiveInMinutes;

            if (reachedGoal) {
                // Send notification
                try {
                    const payload = JSON.stringify({ id: "stopFasting" });
                    webPush.sendNotification(subscription, payload);
                } catch (e) {}

                continue;
            }
        }

        //   START FASTING NOTIFICATION
        // #################################################
        else {
            const midnight = new Date(userLocalTime);
            midnight.setUTCHours(0);
            midnight.setUTCMinutes(0);
            midnight.setUTCSeconds(0);
            midnight.setUTCMilliseconds(0);

            const millisecondsSinceMidnight = Math.abs(userLocalTime - midnight);
            const minutesSinceMidnight = Math.ceil(millisecondsSinceMidnight / 1000 / 60);

            if (minutesSinceMidnight > fastDesiredStartTimeInMinutes) {
                // Send notification
                try {
                    const payload = JSON.stringify({ id: "startFasting" });
                    webPush.sendNotification(subscription, payload);
                } catch (e) {}

                continue;
            }
        }
    }

    console.log("Twice per hour job done");
};

module.exports = twicePerHour;
