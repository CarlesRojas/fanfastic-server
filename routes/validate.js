// Token verification
const verify = require("./verifyToken");

// Token management
const webToken = require("jsonwebtoken");

// Get express Router
const router = require("express").Router();

// Get schemas
const User = require("../models/User");
const FastEntry = require("../models/FastEntry");
const HealthEntry = require("../models/HealthEntry");
const PushSubscription = require("../models/PushSubscription");

// Get the Validation schemas
const {
    isEmailValidValidation,
    isPasswordValidValidation,
    isFastDesiredStartTimeValidValidation,
    isFastObjectiveValidValidation,
    isHeightValidValidation,
    isWeightValidValidation,
    isWeightObjectiveValidValidation,
} = require("../validation");

router.post("/isEmailValid", async (request, response) => {
    // Validate data
    const { error } = isEmailValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Body deconstruction
        const { email, checkIfExists } = request.body;

        // Check if the email exists
        if (checkIfExists) {
            const user = await User.findOne({ email });
            if (user) return response.status(404).json({ error: "This email is already in use." });
        }

        return response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/isPasswordValid", async (request, response) => {
    // Validate data
    const { error } = isPasswordValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });
    return response.status(200).json({ success: true });
});

router.post("/isFastDesiredStartTimeValid", async (request, response) => {
    // Validate data
    const { error } = isFastDesiredStartTimeValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });
    return response.status(200).json({ success: true });
});

router.post("/isFastObjectiveValid", async (request, response) => {
    // Validate data
    const { error } = isFastObjectiveValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });
    return response.status(200).json({ success: true });
});

router.post("/isHeightValid", async (request, response) => {
    // Validate data
    const { error } = isHeightValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });
    return response.status(200).json({ success: true });
});

router.post("/isWeightValid", async (request, response) => {
    // Validate data
    const { error } = isWeightValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });
    return response.status(200).json({ success: true });
});

router.post("/isWeightObjectiveValid", async (request, response) => {
    // Validate data
    const { error } = isWeightObjectiveValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Body deconstruction
        const { weightInKg, weightObjectiveInKg } = request.body;

        if (weightInKg <= weightObjectiveInKg)
            response.status(422).json({ error: "Objective weight is higher or equal to the current weight." });

        return response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});
module.exports = router;
