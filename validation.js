const Joi = require("joi");

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

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.changeEmailValidation = changeEmailValidation;
module.exports.changeUsernameValidation = changeUsernameValidation;
module.exports.changePasswordValidation = changePasswordValidation;
module.exports.deleteAccountValidation = deleteAccountValidation;
module.exports.setFastDesiredStartTimeValidation = setFastDesiredStartTimeValidation;
module.exports.setFastObjectiveValidation = setFastObjectiveValidation;
module.exports.userDateTimeValidation = userDateTimeValidation;
module.exports.getMonthFastEntriesValidation = getMonthFastEntriesValidation;
