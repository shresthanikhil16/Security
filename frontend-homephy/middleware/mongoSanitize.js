/**
 * MongoDB NoSQL Injection Protection Middleware
 * Prevents NoSQL injection attacks by sanitizing user input
 * Removes any keys containing $ or . characters that could be used in injection attacks
 */

const mongoSanitize = require('express-mongo-sanitize');

/**
 * Comprehensive NoSQL injection protection configuration
 */
const sanitizeMiddleware = mongoSanitize({
    // Remove prohibited characters entirely (recommended)
    replaceWith: '',

    // Alternatively, you can replace with a safe character:
    // replaceWith: '_',

    // Allow dots in keys (false = more secure, true = more permissive)
    allowDots: false,

    // Custom function to handle prohibited data
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️  NoSQL Injection attempt detected and blocked:`, {
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            method: req.method,
            suspiciousKey: key,
            body: req.body ? Object.keys(req.body) : 'N/A',
            query: req.query ? Object.keys(req.query) : 'N/A'
        });
    }
});

/**
 * Manual sanitization function for additional security checks
 * @param {Object} payload - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const manualSanitize = (payload) => {
    if (payload && typeof payload === 'object') {
        const sanitized = {};

        for (const key in payload) {
            // Check for prohibited characters in keys
            if (key.includes('$') || key.includes('.')) {
                console.warn(`🚫 Blocked prohibited key: ${key}`);
                continue;
            }

            // Recursively sanitize nested objects
            if (typeof payload[key] === 'object' && payload[key] !== null) {
                if (Array.isArray(payload[key])) {
                    // Sanitize array elements
                    sanitized[key] = payload[key].map(item =>
                        typeof item === 'object' ? manualSanitize(item) : item
                    );
                } else {
                    // Sanitize nested objects
                    sanitized[key] = manualSanitize(payload[key]);
                }
            } else {
                sanitized[key] = payload[key];
            }
        }

        return sanitized;
    }

    return payload;
};

/**
 * Custom middleware for additional NoSQL injection protection
 */
const customNoSQLProtection = (req, res, next) => {
    try {
        // Sanitize request body
        if (req.body) {
            req.body = manualSanitize(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
            req.query = manualSanitize(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
            req.params = manualSanitize(req.params);
        }

        next();
    } catch (error) {
        console.error('❌ NoSQL sanitization error:', error);
        res.status(400).json({
            success: false,
            message: 'Invalid request data format',
            error: 'Request contains potentially malicious content'
        });
    }
};

/**
 * Validation middleware to check for common NoSQL injection patterns
 */
const detectNoSQLInjection = (req, res, next) => {
    const suspiciousPatterns = [
        /\$where/i,
        /\$ne/i,
        /\$gt/i,
        /\$gte/i,
        /\$lt/i,
        /\$lte/i,
        /\$in/i,
        /\$nin/i,
        /\$exists/i,
        /\$regex/i,
        /\$or/i,
        /\$and/i,
        /\$nor/i,
        /\$not/i,
        /javascript:/i,
        /\$eval/i
    ];

    const checkForPatterns = (obj, path = '') => {
        if (typeof obj === 'string') {
            suspiciousPatterns.forEach(pattern => {
                if (pattern.test(obj)) {
                    console.warn(`🚨 Suspicious NoSQL pattern detected: ${pattern} in ${path || 'root'}`);
                    throw new Error(`Prohibited operation detected in request`);
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                checkForPatterns(obj[key], path ? `${path}.${key}` : key);
            });
        }
    };

    try {
        if (req.body) checkForPatterns(req.body, 'body');
        if (req.query) checkForPatterns(req.query, 'query');
        if (req.params) checkForPatterns(req.params, 'params');

        next();
    } catch (error) {
        console.error('🚨 NoSQL injection attempt blocked:', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            error: error.message,
            timestamp: new Date().toISOString()
        });

        res.status(400).json({
            success: false,
            message: 'Request contains prohibited database operations',
            error: 'Security violation detected'
        });
    }
};

module.exports = {
    sanitizeMiddleware,
    manualSanitize,
    customNoSQLProtection,
    detectNoSQLInjection
};
