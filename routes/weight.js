// Get express Router
const router = require("express").Router();

// Token verification
const verify = require("./verifyToken");

// Dot env constants
const dotenv = require("dotenv");
dotenv.config();

// Get the Validation schemas
const {} = require("../validation");

// Get the schemes
const User = require("../models/User");

router.post("/setWeight", verify, async (request, response) => {
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

router.post("/setWeightObjective", verify, async (request, response) => {});

router.post("/setHeight", verify, async (request, response) => {});

router.get("/getWeightHistoric", verify, async (request, response) => {});

module.exports = router;
