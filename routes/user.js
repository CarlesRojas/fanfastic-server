// Encrypt password
const bcrypt = require("bcryptjs");

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
    registerValidation,
    loginValidation,
    isEmailValidValidation,
    isUsernameValidValidation,
    isPasswordValidValidation,
    changeUsernameValidation,
    changeEmailValidation,
    changePasswordValidation,
    deleteAccountValidation,
} = require("../validation");

router.post("/register", async (request, response) => {
    // Validate data
    const { error } = registerValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    // Body deconstruction
    const { email, username, password, timezoneOffsetInMs } = request.body;

    // Check if the email has already been used
    const emailExists = await User.findOne({ email });
    if (emailExists) return response.status(409).json({ error: "Email already taken." });

    // Check if the username has already been used
    const userExists = await User.findOne({ username });
    if (userExists) return response.status(409).json({ error: "Username not available." });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = new User({
        username,
        email,
        password: hashedPassword,
        timezoneOffsetInMs,
    });

    try {
        // Save user to DB
        const newUser = await user.save();

        // Return the user in the response
        response.status(201).json(newUser);
    } catch (error) {
        // Return DB error
        response.status(500).json({ error });
    }
});

router.post("/login", async (request, response) => {
    // Validate data
    const { error } = loginValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Body deconstruction
        const { email, password } = request.body;

        // Check if the email exists
        const user = await User.findOne({ email });
        if (!user) return response.status(404).json({ error: "This email does not exist." });

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return response.status(403).json({ error: "Invalid password." });

        // Create and assign token
        const token = webToken.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
            expiresIn: 60 * 60 * 24 * 365 * 100,
        });

        response.header("token", token).status(200).json({ token });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.get("/testToken", verify, (_, response) => {
    response.status(200).json({ success: true });
});

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

router.post("/isUsernameValid", async (request, response) => {
    // Validate data
    const { error } = isUsernameValidValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Body deconstruction
        const { username } = request.body;

        // Check if the username exists
        const user = await User.findOne({ username });
        if (user) return response.status(404).json({ error: "This username is already taken." });

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

router.post("/changeEmail", verify, async (request, response) => {
    // Validate data
    const { error } = changeEmailValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { email, password } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Check that the new email isn't already taken
        const repeatedUser = await User.findOne({ email });
        if (repeatedUser) return response.status(409).json({ error: "Email already taken." });

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return response.status(403).json({ error: "Invalid password." });

        // Update User
        const newUser = await User.findOneAndUpdate({ _id }, { $set: { email } }, { new: true });

        // Return success
        response.status(200).json(newUser);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/changeUsername", verify, async (request, response) => {
    // Validate data
    const { error } = changeUsernameValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { username, password } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist." });

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return response.status(403).json({ error: "Invalid password." });

        // Check that the new username isn't already taken
        const repeatedUser = await User.findOne({ username });
        if (repeatedUser) return response.status(409).json({ error: "Username not available." });

        // Update User
        const newUser = await User.findOneAndUpdate({ _id }, { $set: { username } }, { new: true });

        // Return success
        response.status(200).json(newUser);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/changePassword", verify, async (request, response) => {
    // Validate data
    const { error } = changePasswordValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { password, newPassword } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return response.status(403).json({ error: "Invalid password." });

        // Check that the password is different
        const samePassword = await bcrypt.compare(newPassword, user.password);
        if (samePassword) return response.status(409).json({ error: "The new password is the same." });

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update User
        const newUser = await User.findOneAndUpdate({ _id }, { $set: { password: hashedPassword } }, { new: true });

        // Return success
        response.status(200).json(newUser);
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

router.post("/deleteAccount", verify, async (request, response) => {
    // Validate data
    const { error } = deleteAccountValidation(request.body);

    // If there is a validation error
    if (error) return response.status(422).json({ error: error.details[0].message });

    try {
        // Deconstruct request
        const { _id } = request;
        const { password } = request.body;

        // Get user
        const user = await User.findOne({ _id });
        if (!user) return response.status(404).json({ error: "User does not exist" });

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return response.status(403).json({ error: "Invalid password." });

        // Delete User
        await User.deleteOne({ _id });

        // Delete users Fast Entries
        await FastEntry.deleteMany({ userId: _id });

        // Delete users Health Entries
        await HealthEntry.deleteMany({ userId: _id });

        // Delete users Push Subscriptions
        await PushSubscription.deleteMany({ userId: _id });

        // Return success
        response.status(200).json({ success: true });
    } catch (error) {
        // Return error
        response.status(500).json({ error });
    }
});

module.exports = router;
