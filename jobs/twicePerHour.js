// Push notifications library
const webPush = require("web-push");

// Get the schemas
const User = require("../models/User");
const PushSubscription = require("../models/PushSubscription");
const HealthEntry = require("../models/HealthEntry");

// Utils
const areSameDate = require("../utils/areSameDate");

const twicePerHour = async () => {
    // #################################################
    //   UPDATE USERS
    // #################################################

    // Get all users
    const users = await User.find({});

    const updateUsersPromises = users.map(
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

    const notificationPromises = pushSubscriptions.map(
        async ({
            userId,
            subscription,
            startFastingNotificationSentToday,
            stopFastingNotificationSentToday,
            weightReminderNotificationSentToday,
        }) => {
            // Get user
            const user = await User.findOne({ _id: userId });

            // If the user does not exist -> Delete this notification
            if (!user) {
                try {
                    await PushSubscription.deleteOne({ userId, "subscription.endpoint": subscription.endpoint });
                } catch (e) {}
                return;
            }

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
            const hour = userLocalTime.getUTCHours();
            const minute = userLocalTime.getUTCMinutes();

            var stopFastingSent = false;
            var startFastingSent = false;
            var weightReminderSent = false;

            //   STOP FASTING NOTIFICATION
            // #################################################

            if (!stopFastingNotificationSentToday && isFasting) {
                // Fasting current duration
                const startDate = new Date(lastTimeUserStartedFasting);
                const fastDurationInMilliseconds = Math.abs(userLocalTime - startDate);
                const fastDurationInMinutes = Math.ceil(fastDurationInMilliseconds / 1000 / 60);
                const reachedGoal = fastDurationInMinutes >= fastObjectiveInMinutes;

                // Send notification
                if (reachedGoal) {
                    try {
                        const payload = JSON.stringify({ id: "stopFasting", user });
                        webPush.sendNotification(subscription, payload);
                        stopFastingSent = true;
                    } catch (e) {}
                }
            }

            //   START FASTING NOTIFICATION
            // #################################################
            else if (!startFastingNotificationSentToday && !isFasting) {
                const midnight = new Date(userLocalTime);
                midnight.setUTCHours(0);
                midnight.setUTCMinutes(0);
                midnight.setUTCSeconds(0);
                midnight.setUTCMilliseconds(0);

                const millisecondsSinceMidnight = Math.abs(userLocalTime - midnight);
                const minutesSinceMidnight = Math.ceil(millisecondsSinceMidnight / 1000 / 60);

                // Send notification
                if (minutesSinceMidnight > fastDesiredStartTimeInMinutes) {
                    try {
                        const payload = JSON.stringify({ id: "startFasting", user });
                        webPush.sendNotification(subscription, payload);
                        startFastingSent = true;
                    } catch (e) {}
                }
            }

            //   HEALTH CHECK NOTIFICATION
            // #################################################

            // Find last health entry
            const newestHealthEntry = await HealthEntry.findOne({ userId }, {}, { sort: { created_at: -1 } });
            var remindToAddNewHelthEntry = false;
            if (!newestHealthEntry || !("date" in newestHealthEntry)) remindToAddNewHelthEntry = true;
            else {
                const localTimeLastHealthEntry = new Date(newestHealthEntry.date);

                const millisecondsSinceLastHealthEntry = Math.abs(userLocalTime - localTimeLastHealthEntry);
                const daysSinceLastHealthEntry = millisecondsSinceLastHealthEntry / 1000 / 60 / 60 / 24;

                remindToAddNewHelthEntry = daysSinceLastHealthEntry > 7;
            }

            // Every day at 12 -> Remind them to input their weight, if they do, then dont remindem until next week
            if (
                remindToAddNewHelthEntry &&
                !weightReminderNotificationSentToday &&
                hour === 12 &&
                minute >= 0 &&
                minute < 30
            ) {
                // Send notification
                try {
                    const payload = JSON.stringify({ id: "weightReminder", user });
                    webPush.sendNotification(subscription, payload);
                    weightReminderSent = true;
                } catch (e) {}
            }

            //   UPDATE PUSH NOTIFICATIONS
            // #################################################

            // If it is the first half hour of the day -> Reset notifications
            const resetNotifications =
                (startFastingNotificationSentToday ||
                    stopFastingNotificationSentToday ||
                    weightReminderNotificationSentToday) &&
                hour === 0 &&
                minute >= 0 &&
                minute < 30;

            await PushSubscription.findOneAndUpdate(
                { userId, "subscription.endpoint": subscription.endpoint },
                {
                    $set: {
                        startFastingNotificationSentToday: startFastingSent
                            ? true
                            : resetNotifications
                            ? false
                            : startFastingNotificationSentToday,

                        stopFastingNotificationSentToday: stopFastingSent
                            ? true
                            : resetNotifications
                            ? false
                            : stopFastingNotificationSentToday,

                        weightReminderNotificationSentToday: weightReminderSent
                            ? true
                            : resetNotifications
                            ? false
                            : weightReminderNotificationSentToday,
                    },
                }
            );
        }
    );

    await Promise.all(updateUsersPromises);
    await Promise.all(notificationPromises);

    console.log("Twice per hour job done");
};

module.exports = twicePerHour;
