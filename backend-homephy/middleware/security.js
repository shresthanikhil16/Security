const helmet = require("helmet");

/**
 * Security middleware configuration using Helmet
 * Provides XSS protection and other security headers
 */
const securityMiddleware = helmet({
    // Content Security Policy for XSS protection
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://www.googletagmanager.com",
                "https://www.google-analytics.com",
                "https://ssl.google-analytics.com",
                "https://tagmanager.google.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "http:",
                "https://localhost:3000",
                "https://localhost:5173",
                "https://www.google-analytics.com",
                "https://ssl.google-analytics.com",
                "https://www.googletagmanager.com"
            ],
            connectSrc: [
                "'self'",
                "https:",
                "http:",
                "https://localhost:3000",
                "https://localhost:5173",
                "https://www.google-analytics.com",
                "https://analytics.google.com",
                "https://ssl.google-analytics.com",
                "https://www.googletagmanager.com",
                "https://region1.google-analytics.com",
                "https://region1.analytics.google.com"
            ],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https://localhost:3000"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },

    // Cross-Origin Embedder Policy (disabled for API compatibility)
    crossOriginEmbedderPolicy: false,

    // Cross-Origin Resource Policy (allow cross-origin for static files)
    crossOriginResourcePolicy: false,

    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },

    // X-Content-Type-Options: nosniff
    noSniff: true,

    // X-XSS-Protection: 1; mode=block (legacy but still useful)
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
        policy: "same-origin"
    },

    // X-Frame-Options: DENY (prevents clickjacking)
    frameguard: {
        action: 'deny'
    },

    // Remove X-Powered-By header
    hidePoweredBy: true,

    // X-DNS-Prefetch-Control: off
    dnsPrefetchControl: {
        allow: false
    }
});

/**
 * Additional XSS protection middleware for request sanitization
 */
const xssProtection = (req, res, next) => {
    // Set additional XSS protection headers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    next();
};

module.exports = {
    securityMiddleware,
    xssProtection
};
