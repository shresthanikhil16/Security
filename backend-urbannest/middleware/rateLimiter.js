// middleware/rateLimit.js
const rateLimit = require("express-rate-limit");

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Reduced to 10 for better security (adjust as needed)
    message: {
        success: false,
        message: "Too many login attempts from this IP, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { loginRateLimiter };