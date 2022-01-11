const Joi = require("joi");

// #################################################
//   USER
// #################################################

const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(12).required(),
        email: Joi.string().min(6).max(256).required().email(),
        password: Joi.string().min(6).max(1024).required(),
        timezoneOffsetInMs: Joi.number().required(),
    });

    return schema.validate(data);
};

const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(256).required().email(),
        password: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
};

const isEmailValidValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(256).required().email(),
        checkIfExists: Joi.boolean().required(),
    });

    return schema.validate(data);
};

const isUsernameValidValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(12).required(),
    });

    return schema.validate(data);
};

const isPasswordValidValidation = (data) => {
    const schema = Joi.object({
        password: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
};

const changeEmailValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(256).required().email(),
        password: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
};

const changeUsernameValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(12).required(),
        password: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
};

const changePasswordValidation = (data) => {
    const schema = Joi.object({
        password: Joi.string().min(6).max(1024).required(),
        newPassword: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
};

const deleteAccountValidation = (data) => {
    const schema = Joi.object({
        password: Joi.string().min(6).max(1024).required(),
    });

    return schema.validate(data);
};

// #################################################
//   FAST
// #################################################

const setFastDesiredStartTimeValidation = (data) => {
    const schema = Joi.object({
        fastDesiredStartTimeInMinutes: Joi.number()
            .min(0)
            .max(24 * 60 - 1)
            .required(),
    });

    return schema.validate(data);
};

const setFastObjectiveValidation = (data) => {
    const schema = Joi.object({
        fastObjectiveInMinutes: Joi.number()
            .min(0)
            .max(24 * 60 - 1)
            .required(),
    });

    return schema.validate(data);
};

const userDateTimeValidation = (data) => {
    const schema = Joi.object({
        date: Joi.date().required(),
        timezoneOffsetInMs: Joi.number().required(),
    });

    return schema.validate(data);
};

const getMonthFastEntriesValidation = (data) => {
    const schema = Joi.object({
        month: Joi.number().min(0).max(12).required(),
        year: Joi.number().min(2020).required(),
    });

    return schema.validate(data);
};

// #################################################
//   HEALTH
// #################################################

const setHeightValidation = (data) => {
    const schema = Joi.object({
        heightInCm: Joi.number().min(0).max(300).required(),
    });

    return schema.validate(data);
};

const setWeightValidation = (data) => {
    const schema = Joi.object({
        weightInKg: Joi.number().min(0).max(700).required(),
        date: Joi.date().required(),
        timezoneOffsetInMs: Joi.number().required(),
    });

    return schema.validate(data);
};

const setWeightObjectiveValidation = (data) => {
    const schema = Joi.object({
        weightObjectiveInKg: Joi.number().min(-1).max(700).required(),
    });

    return schema.validate(data);
};

// #################################################
//   PUSH
// #################################################

const subscriptionValidation = (data) => {
    const schema = Joi.object({
        endpoint: Joi.string().required(),
        expirationTime: Joi.number().allow(null),
        keys: {
            auth: Joi.string(),
            p256dh: Joi.string(),
        },
    });

    return schema.validate(data);
};

// USER
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.isEmailValidValidation = isEmailValidValidation;
module.exports.isUsernameValidValidation = isUsernameValidValidation;
module.exports.isPasswordValidValidation = isPasswordValidValidation;
module.exports.changeEmailValidation = changeEmailValidation;
module.exports.changeUsernameValidation = changeUsernameValidation;
module.exports.changePasswordValidation = changePasswordValidation;
module.exports.deleteAccountValidation = deleteAccountValidation;

// FAST
module.exports.setFastDesiredStartTimeValidation = setFastDesiredStartTimeValidation;
module.exports.setFastObjectiveValidation = setFastObjectiveValidation;
module.exports.userDateTimeValidation = userDateTimeValidation;
module.exports.getMonthFastEntriesValidation = getMonthFastEntriesValidation;

// HEALTH
module.exports.setHeightValidation = setHeightValidation;
module.exports.setWeightValidation = setWeightValidation;
module.exports.setWeightObjectiveValidation = setWeightObjectiveValidation;

// PUSH
module.exports.subscriptionValidation = subscriptionValidation;
