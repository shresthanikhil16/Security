const csrf = require('csrf');
const cookieParser = require('cookie-parser');

// Create CSRF instance
const tokens = new csrf();

// CSRF middleware
const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests and specific routes
    if (req.method === 'GET' ||
        req.path === '/api/auth/csrf-token' ||
        req.path === '/api/csrf-token' ||
        req.path === '/api/auth/register' ||
        req.path === '/api/auth/login' ||
        req.path === '/api/auth/verify-otp' ||
        req.path === '/api/auth/forgotpassword' ||
        req.path === '/api/auth/forgot-password' ||
        req.path === '/api/auth/verify-forgot-password-otp' ||
        req.path === '/api/auth/reset-password' ||
        req.path === '/api/auth/reset-password-with-otp' ||
        req.path === '/api/rooms/nearby' ||
        req.path === '/api/rooms' && (req.method === 'POST' || req.method === 'PUT') ||
        req.path.startsWith('/api/rooms/') && req.method === 'DELETE' ||
        req.path === '/api/contact' ||
        req.path === '/api/email/send' ||
        req.path.startsWith('/uploads/') || // Skip CSRF for static uploads
        req.path.startsWith('/api/esewa/') ||
        req.path.startsWith('/api/audit/') ||
        req.path === '/test') {
        return next();
    }

    // Get the token from header or body
    const token = req.headers['x-csrf-token'] ||
        req.headers['csrf-token'] ||
        req.body._csrf ||
        req.query._csrf;

    // Get the secret from cookies
    const secret = req.cookies['csrf-secret'];

    if (!secret) {
        return res.status(403).json({
            success: false,
            message: 'CSRF secret not found. Please get a new CSRF token.'
        });
    }

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing. Please include CSRF token in request.'
        });
    }

    // Verify the token
    if (!tokens.verify(secret, token)) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token.'
        });
    }

    next();
};

// Function to generate CSRF token
const generateCSRFToken = (req, res) => {
    const secret = tokens.secretSync();
    const token = tokens.create(secret);

    // Set secret in httpOnly cookie
    res.cookie('csrf-secret', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
        success: true,
        csrfToken: token
    });
};

module.exports = {
    csrfProtection,
    generateCSRFToken
};
