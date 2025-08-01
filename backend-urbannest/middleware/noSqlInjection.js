const mongoSanitize = require('mongo-sanitize');

/**
 * 🛡️ NoSQL Injection Protection Middleware
 * 
 * This middleware provides comprehensive protection against NoSQL injection attacks by:
 * 1. Sanitizing user input to remove MongoDB operators ($, .)
 * 2. Recursively cleaning nested objects and arrays
 * 3. Logging potential injection attempts for security monitoring
 * 4. Maintaining data integrity while preventing malicious queries
 */

// Enhanced sanitization function with logging
const enhancedSanitize = (input, path = 'root') => {
    if (input === null || input === undefined) {
        return input;
    }

    // Check for potential injection patterns before sanitization
    const inputString = JSON.stringify(input);
    const suspiciousPatterns = [
        /\$where/gi,
        /\$ne/gi,
        /\$gt/gi,
        /\$lt/gi,
        /\$gte/gi,
        /\$lte/gi,
        /\$in/gi,
        /\$nin/gi,
        /\$regex/gi,
        /\$exists/gi,
        /\$type/gi,
        /\$mod/gi,
        /\$all/gi,
        /\$size/gi,
        /\$elemMatch/gi,
        /javascript:/gi,
        /eval\s*\(/gi
    ];

    let detectedPatterns = [];
    suspiciousPatterns.forEach(pattern => {
        if (pattern.test(inputString)) {
            detectedPatterns.push(pattern.source);
        }
    });

    if (detectedPatterns.length > 0) {
        console.warn(`🚨 POTENTIAL NoSQL INJECTION DETECTED:`);
        console.warn(`  - Path: ${path}`);
        console.warn(`  - Patterns: ${detectedPatterns.join(', ')}`);
        console.warn(`  - Original input: ${inputString.substring(0, 200)}...`);
    }

    // Apply mongo-sanitize
    const sanitized = mongoSanitize(input);

    // Additional custom sanitization
    if (typeof sanitized === 'object' && sanitized !== null) {
        return recursiveSanitize(sanitized, path);
    }

    return sanitized;
};

// Recursive sanitization for nested objects
const recursiveSanitize = (obj, path = 'root') => {
    if (Array.isArray(obj)) {
        return obj.map((item, index) => enhancedSanitize(item, `${path}[${index}]`));
    }

    if (typeof obj === 'object' && obj !== null) {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            // Remove keys that start with $ or contain dots (MongoDB operators)
            if (key.startsWith('$') || key.includes('.')) {
                console.warn(`🚨 BLOCKED NoSQL OPERATOR: Removed key "${key}" from ${path}`);
                continue;
            }

            // Sanitize the key name itself
            const sanitizedKey = key.replace(/[\$\.]/g, '');
            sanitizedObj[sanitizedKey] = enhancedSanitize(value, `${path}.${sanitizedKey}`);
        }
        return sanitizedObj;
    }

    return obj;
};

// Main NoSQL injection protection middleware
const noSqlInjectionProtection = (req, res, next) => {
    try {
        console.log(`🛡️ NoSQL INJECTION PROTECTION - ${req.method} ${req.path}`);

        // Sanitize request body
        if (req.body && Object.keys(req.body).length > 0) {
            const originalBody = JSON.stringify(req.body);
            req.body = enhancedSanitize(req.body, 'req.body');
            const sanitizedBody = JSON.stringify(req.body);

            if (originalBody !== sanitizedBody) {
                console.log(`✅ REQUEST BODY SANITIZED - ${req.path}`);
                console.log(`  - Before: ${originalBody.substring(0, 100)}...`);
                console.log(`  - After: ${sanitizedBody.substring(0, 100)}...`);
            }
        }

        // Sanitize query parameters
        if (req.query && Object.keys(req.query).length > 0) {
            const originalQuery = JSON.stringify(req.query);
            req.query = enhancedSanitize(req.query, 'req.query');
            const sanitizedQuery = JSON.stringify(req.query);

            if (originalQuery !== sanitizedQuery) {
                console.log(`✅ QUERY PARAMS SANITIZED - ${req.path}`);
                console.log(`  - Before: ${originalQuery}`);
                console.log(`  - After: ${sanitizedQuery}`);
            }
        }

        // Sanitize route parameters
        if (req.params && Object.keys(req.params).length > 0) {
            const originalParams = JSON.stringify(req.params);
            req.params = enhancedSanitize(req.params, 'req.params');
            const sanitizedParams = JSON.stringify(req.params);

            if (originalParams !== sanitizedParams) {
                console.log(`✅ ROUTE PARAMS SANITIZED - ${req.path}`);
                console.log(`  - Before: ${originalParams}`);
                console.log(`  - After: ${sanitizedParams}`);
            }
        }

        console.log(`✅ NoSQL PROTECTION COMPLETE - ${req.path}`);
        next();

    } catch (error) {
        console.error('💥 NoSQL INJECTION PROTECTION ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Input validation failed',
            error: 'Invalid request format'
        });
    }
};

// Utility function for manual sanitization in controllers
const sanitizeInput = (input, fieldName = 'input') => {
    return enhancedSanitize(input, fieldName);
};

// Export middleware and utilities
module.exports = {
    noSqlInjectionProtection,
    sanitizeInput,
    enhancedSanitize
};
