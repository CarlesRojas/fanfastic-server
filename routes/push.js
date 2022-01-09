// Get express Router
const router = require("express").Router();

// Push notifications
const webPush = require("web-push");

// Token verification
const verify = require("./verifyToken");

// Dot env constants
const dotenv = require("dotenv");
dotenv.config();

// Get the Validation schemas
const { subscriptionValidation } = require("../validation");

router.post("/subscribe", verify, async (request, response) => {
    // Validate data
    const { error } = subscriptionValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const subscription = request.body;

        console.log(subscription);
        response.status(200).json({});

        console.log(3);
        // Create payload
        const payload = JSON.stringify({
            title: "Push title",
            body: "This is the text of the notification.",
            icon: "http://image.ibb.co/frYOFd/tmlogo.png",
        });

        console.log(payload);
        webPush.sendNotification(subscription, payload);
        console.log(4);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

module.exports = router;
