// Enhanced rate limiter middleware for UrbanNest security
const rateLimit = require("express-rate-limit");

// Enhanced rate limiter for login attempts with security logging
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
        code: 'RATE_LIMIT_LOGIN'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins toward the limit
    skipFailedRequests: false, // Count failed attempts
    handler: (req, res) => {
        console.log(`🚨 LOGIN RATE LIMIT EXCEEDED - IP: ${req.ip}, Time: ${new Date().toISOString()}, Email: ${req.body?.email || 'Not provided'}`);
        res.status(429).json({
            success: false,
            message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
            retryAfter: '15 minutes',
            code: 'RATE_LIMIT_LOGIN',
            details: 'This is a security measure to prevent brute-force attacks.'
        });
    }
});

// Enhanced rate limiter for OTP verification
const otpRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 OTP attempts per window
    message: {
        success: false,
        message: 'Too many OTP verification attempts. Please try again after 5 minutes.',
        retryAfter: '5 minutes',
        code: 'RATE_LIMIT_OTP'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful OTP verifications
    handler: (req, res) => {
        console.log(`🚨 OTP RATE LIMIT EXCEEDED - IP: ${req.ip}, Time: ${new Date().toISOString()}`);
        res.status(429).json({
            success: false,
            message: 'Too many OTP verification attempts from this IP. Please try again after 5 minutes.',
            retryAfter: '5 minutes',
            code: 'RATE_LIMIT_OTP',
            details: 'Please wait before attempting to verify OTP again.'
        });
    }
});

// Enhanced global API rate limiter
const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // 150 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
        code: 'RATE_LIMIT_API'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚨 API RATE LIMIT EXCEEDED - IP: ${req.ip}, Endpoint: ${req.path}, Time: ${new Date().toISOString()}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP. Please try again after 15 minutes.',
            retryAfter: '15 minutes',
            code: 'RATE_LIMIT_API',
            details: 'Rate limit exceeded for API requests.'
        });
    }
});

// Rate limiter for registration attempts
const registrationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts from this IP. Please try again after 1 hour.',
        retryAfter: '1 hour',
        code: 'RATE_LIMIT_REGISTRATION'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        console.log(`🚨 REGISTRATION RATE LIMIT EXCEEDED - IP: ${req.ip}, Time: ${new Date().toISOString()}, Email: ${req.body?.email || 'Not provided'}`);
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts from this IP. Please try again after 1 hour.',
            retryAfter: '1 hour',
            code: 'RATE_LIMIT_REGISTRATION',
            details: 'This prevents spam registrations and abuse.'
        });
    }
});

// Rate limiter for password reset attempts
const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: {
        success: false,
        message: 'Too many password reset attempts from this IP. Please try again after 1 hour.',
        retryAfter: '1 hour',
        code: 'RATE_LIMIT_PASSWORD_RESET'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚨 PASSWORD RESET RATE LIMIT EXCEEDED - IP: ${req.ip}, Time: ${new Date().toISOString()}, Email: ${req.body?.email || 'Not provided'}`);
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts from this IP. Please try again after 1 hour.',
            retryAfter: '1 hour',
            code: 'RATE_LIMIT_PASSWORD_RESET',
            details: 'This prevents abuse of the password reset system.'
        });
    }
});

// Rate limiter for contact form submissions
const contactRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 contact form submissions per hour
    message: {
        success: false,
        message: 'Too many contact form submissions from this IP. Please try again after 1 hour.',
        retryAfter: '1 hour',
        code: 'RATE_LIMIT_CONTACT'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚨 CONTACT RATE LIMIT EXCEEDED - IP: ${req.ip}, Time: ${new Date().toISOString()}`);
        res.status(429).json({
            success: false,
            message: 'Too many contact form submissions from this IP. Please try again after 1 hour.',
            retryAfter: '1 hour',
            code: 'RATE_LIMIT_CONTACT',
            details: 'This prevents spam in our contact system.'
        });
    }
});


module.exports = {
    loginRateLimiter,
    otpRateLimiter,
    apiRateLimiter,
    registrationRateLimiter,
    passwordResetRateLimiter,
    contactRateLimiter
};