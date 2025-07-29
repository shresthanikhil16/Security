const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const asyncHandler = require("../middleware/async");
const { loginRateLimiter } = require("../middleware/rateLimiter");
const verifyRecaptcha = require("../middleware/verifyRecaptcha");
const { registerUser, verifyOTP, loginUser, forgotPassword, resetPassword, verifyForgotPasswordOTP } = require("../controllers/authController");

router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Invalid email"),
        body("password")
            .isLength({ min: 8, max: 50 })
            .withMessage("Password must be between 8 and 50 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/)
            .withMessage(
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),
        body("confirm_password")
            .notEmpty()
            .withMessage("Confirm Password is required")
            .custom((value, { req }) => value === req.body.password)
            .withMessage("Passwords do not match"),
        body("role").isIn(["user", "admin"]).optional().withMessage("Invalid role"),
        body("recaptchaToken").notEmpty().withMessage("reCAPTCHA token is required"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    verifyRecaptcha,
    asyncHandler(registerUser)
);

router.post(
    "/verify-otp",
    [
        body("otp").notEmpty().withMessage("OTP is required"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(verifyOTP)
);

router.post(
    "/login",
    loginRateLimiter,
    verifyRecaptcha,
    [
        body("email").isEmail().withMessage("Invalid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(loginUser)
);

router.post(
    "/forgot-password",
    [
        body("email").isEmail().withMessage("Invalid email"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(forgotPassword)
);

// Alternative route without hyphen for frontend compatibility
router.post(
    "/forgotpassword",
    [
        body("email").isEmail().withMessage("Invalid email"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(forgotPassword)
);

router.post(
    "/verify-forgot-password-otp",
    [
        body("email").isEmail().withMessage("Invalid email"),
        body("otp").notEmpty().withMessage("OTP is required"),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(verifyForgotPasswordOTP)
);

router.post(
    "/reset-password",
    [
        body("email").isEmail().withMessage("Invalid email"),
        body("otp").notEmpty().withMessage("Reset code is required"),
        body("newPassword")
            .isLength({ min: 8, max: 50 })
            .withMessage("Password must be between 8 and 50 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/)
            .withMessage(
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(resetPassword)
);

// Alternative route for frontend compatibility
router.post(
    "/reset-password-with-otp",
    [
        body("email").isEmail().withMessage("Invalid email"),
        body("otp").notEmpty().withMessage("Reset code is required"),
        body("newPassword")
            .isLength({ min: 8, max: 50 })
            .withMessage("Password must be between 8 and 50 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/)
            .withMessage(
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    asyncHandler(resetPassword)
);

module.exports = router;