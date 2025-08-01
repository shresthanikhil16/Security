const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Security middleware imports
const { sanitizeMiddleware, customNoSQLProtection } = require('./middleware/mongoSanitize');
const { enhancedCSRFProtection, generateCSRFTokenHandler } = require('./middleware/enhancedCSRF');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

app.use(sanitizeMiddleware);
app.use(customNoSQLProtection);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many requests from this IP',
        retryAfter: '15 minutes'
    }
});
app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection
app.use(enhancedCSRFProtection);

// Security endpoints
app.get('/api/auth/csrf-token', generateCSRFTokenHandler);

// Test endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: '🔐 Secure UrbanNest API', 
        timestamp: new Date(),
        security: 'enabled'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        security: {
            csrf: 'enabled',
            sanitization: 'enabled',
            rateLimit: 'enabled',
            helmet: 'enabled'
        },
        timestamp: new Date()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔐 Secure UrbanNest API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 CSRF Token: http://localhost:${PORT}/api/auth/csrf-token`);
});

module.exports = app;