// Get express Router
const router = require("express").Router();

// Token verification
const verify = require("./verifyToken");

// Dot env constants
const dotenv = require("dotenv");
dotenv.config();

// Get the Validation schemas
const { subscriptionValidation } = require("../validation");

// Get the schemes
const User = require("../models/User");
const PushSubscription = require("../models/PushSubscription");

router.post("/subscribe", verify, async (request, response) => {
    // Validate data
    const { error } = subscriptionValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const subscription = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Create push subscription
        const pushSubscription = new PushSubscription({
            userId: _id,
            subscription,
        });

        // Save push subscription to DB
        await pushSubscription.save();

        response.status(200).json({});
    } catch (error) {
        if (error.code === 11000) return response.status(409).json({ error: "This device is already subscribed." });

        // Return error
        response.status(500).json({ error });
    }
});

router.get("/unsubscribe", verify, async (request, response) => {
    try {
        // Deconstruct request
        const { _id } = request;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Delete users Push Subscriptions
        await PushSubscription.deleteMany({ userId: _id });

        response.status(200).json({});
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

module.exports = router;
