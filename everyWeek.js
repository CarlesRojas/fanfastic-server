// Get the schemas
const User = require("./models/User");

const everyWeek = async () => {
    console.log("Week Job Done");

    await User.updateMany({}, { $set: { hasWeeklyPass: true } });
};

module.exports = everyWeek;
