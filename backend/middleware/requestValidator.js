const { body, validationResult } = require('express-validator');

const { validatePassword } = require('../utils/passwordValidator');

// Middleware to check validation results and return errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0]?.msg || 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Validation rules for registration
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .custom((value) => {
            const result = validatePassword(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        }),
    body('otp')
        .optional()
        .trim(),
    body('institution')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Institution name too long'),
    validate
];

// Validation rules for login
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

// Validation rules for OTP request
const otpValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    validate
];

// Validation rules for profile update
const profileUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must be under 500 characters'),
    body('linkedin')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i).withMessage('Please provide a valid LinkedIn URL'),
    validate
];

// Validation rules for password change
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password cannot be the same as your current password.');
            }
            const result = validatePassword(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        }),
    validate
];

// Validation rules for token-based password reset
const resetPasswordValidation = [
    body('token')
        .trim()
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .custom((value) => {
            const result = validatePassword(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        }),
    validate
];

// Validation rules for OTP-based password reset
const resetPasswordWithOTPValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('otp')
        .trim()
        .notEmpty().withMessage('Verification OTP is required')
        .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4 to 6 digits'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .custom((value) => {
            const result = validatePassword(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        }),
    validate
];

// Validation rules for forgot password
const forgotPasswordValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    validate
];

// Validation rules for creating a post
const createPostValidation = [
    body('content')
        .trim()
        .notEmpty().withMessage('Post content is required')
        .isLength({ min: 1, max: 5000 }).withMessage('Post content must be between 1 and 5000 characters'),
    validate
];

// Validation rules for creating a job
const createJobValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Job title is required')
        .isLength({ max: 200 }).withMessage('Job title must be under 200 characters'),
    body('company')
        .trim()
        .notEmpty().withMessage('Company name is required'),
    body('description')
        .trim()
        .notEmpty().withMessage('Job description is required')
        .isLength({ max: 10000 }).withMessage('Description too long'),
    validate
];

// Validation rules for creating an event
const createEventValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Event title is required')
        .isLength({ max: 200 }).withMessage('Event title must be under 200 characters'),
    body('date')
        .notEmpty().withMessage('Event date is required'),
    validate
];

// Validation rules for sending a message
const sendMessageValidation = [
    body('content')
        .trim()
        .notEmpty().withMessage('Message content is required')
        .isLength({ max: 5000 }).withMessage('Message too long'),
    validate
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    otpValidation,
    profileUpdateValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    resetPasswordWithOTPValidation,
    createPostValidation,
    createJobValidation,
    createEventValidation,
    sendMessageValidation
};
