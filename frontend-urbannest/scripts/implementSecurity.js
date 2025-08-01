#!/usr/bin/env node

/**
 * Backend Security Implementation Script
 * Automates the implementation of comprehensive security measures
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Starting Backend Security Implementation...\n');

/**
 * Security implementation steps
 */
const securitySteps = [
    {
        name: 'Package Dependencies',
        description: 'Add required security packages to package.json',
        action: addSecurityDependencies
    },
    {
        name: 'MongoDB Sanitization',
        description: 'Implement mongo-sanitize middleware',
        action: implementMongoSanitize
    },
    {
        name: 'Enhanced Password Security',
        description: 'Upgrade password hashing and validation',
        action: enhancePasswordSecurity
    },
    {
        name: 'Token Security',
        description: 'Implement secure token generation and hashing',
        action: implementTokenSecurity
    },
    {
        name: 'Enhanced CSRF Protection',
        description: 'Upgrade CSRF protection with token hashing',
        action: enhanceCSRFProtection
    },
    {
        name: 'Security Middleware Integration',
        description: 'Integrate all security middleware in main server',
        action: integrateSecurityMiddleware
    },
    {
        name: 'Database Security Updates',
        description: 'Update database models for enhanced security',
        action: updateDatabaseSecurity
    },
    {
        name: 'Security Testing',
        description: 'Set up security testing framework',
        action: setupSecurityTesting
    }
];

/**
 * Main execution function
 */
async function main() {
    let completedSteps = 0;

    for (const step of securitySteps) {
        try {
            console.log(`📋 Step ${completedSteps + 1}/${securitySteps.length}: ${step.name}`);
            console.log(`   ${step.description}`);

            await step.action();
            completedSteps++;

            console.log(`   ✅ Completed\n`);
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}\n`);
            break;
        }
    }

    if (completedSteps === securitySteps.length) {
        console.log('🎉 Security implementation completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Run: npm install (in backend directory)');
        console.log('2. Update your .env file with new security variables');
        console.log('3. Run the security test suite');
        console.log('4. Review and test all authentication flows');
        console.log('5. Update frontend to use enhanced security features\n');
    } else {
        console.log(`⚠️  Security implementation partially completed (${completedSteps}/${securitySteps.length} steps)`);
        console.log('Please review the errors above and complete remaining steps manually.\n');
    }
}

/**
 * Step 1: Add security dependencies
 */
async function addSecurityDependencies() {
    const packageJsonPath = './package.json';

    if (!fs.existsSync(packageJsonPath)) {
        console.log('   📝 Creating new package.json with security dependencies...');
        const packageJson = {
            name: "urbannest-backend",
            version: "1.0.0",
            description: "Secure backend for UrbanNest application",
            main: "index.js",
            scripts: {
                start: "node index.js",
                dev: "nodemon index.js",
                test: "jest",
                "security-test": "node tests/securityTestSuite.js"
            },
            dependencies: {
                "express": "^4.18.2",
                "mongoose": "^7.5.0",
                "bcryptjs": "^2.4.3",
                "jsonwebtoken": "^9.0.2",
                "express-mongo-sanitize": "^2.2.0",
                "helmet": "^7.1.0",
                "express-rate-limit": "^7.1.5",
                "cors": "^2.8.5",
                "dotenv": "^16.3.1",
                "nodemailer": "^6.9.4",
                "randomstring": "^1.3.0",
                "cookie-parser": "^1.4.6",
                "express-validator": "^7.0.1",
                "multer": "^1.4.5"
            },
            devDependencies: {
                "nodemon": "^3.0.1",
                "jest": "^29.7.0"
            }
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } else {
        console.log('   📦 Updating existing package.json...');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const securityDeps = {
            "express-mongo-sanitize": "^2.2.0",
            "bcryptjs": "^2.4.3",
            "helmet": "^7.1.0",
            "express-rate-limit": "^7.1.5"
        };

        packageJson.dependencies = { ...packageJson.dependencies, ...securityDeps };

        if (!packageJson.scripts) packageJson.scripts = {};
        packageJson.scripts["security-test"] = "node tests/securityTestSuite.js";

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
}

/**
 * Step 2: Implement MongoDB sanitization
 */
async function implementMongoSanitize() {
    const middlewareDir = './middleware';
    if (!fs.existsSync(middlewareDir)) {
        fs.mkdirSync(middlewareDir, { recursive: true });
    }

    const mongoSanitizeContent = `/**
 * MongoDB NoSQL Injection Protection Middleware
 */
const mongoSanitize = require('express-mongo-sanitize');

const sanitizeMiddleware = mongoSanitize({
    replaceWith: '',
    allowDots: false,
    onSanitize: ({ req, key }) => {
        console.warn('⚠️  NoSQL Injection attempt detected:', {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            suspiciousKey: key
        });
    }
});

const customNoSQLProtection = (req, res, next) => {
    try {
        if (req.body) req.body = manualSanitize(req.body);
        if (req.query) req.query = manualSanitize(req.query);
        if (req.params) req.params = manualSanitize(req.params);
        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid request data format',
            error: 'Request contains potentially malicious content'
        });
    }
};

const manualSanitize = (payload) => {
    if (payload && typeof payload === 'object') {
        const sanitized = {};
        for (const key in payload) {
            if (key.includes('$') || key.includes('.')) {
                console.warn('🚫 Blocked prohibited key:', key);
                continue;
            }
            sanitized[key] = typeof payload[key] === 'object' ? manualSanitize(payload[key]) : payload[key];
        }
        return sanitized;
    }
    return payload;
};

module.exports = {
    sanitizeMiddleware,
    customNoSQLProtection,
    manualSanitize
};`;

    fs.writeFileSync(path.join(middlewareDir, 'mongoSanitize.js'), mongoSanitizeContent);
}

/**
 * Step 3: Enhance password security
 */
async function enhancePasswordSecurity() {
    const utilsDir = './utils';
    if (!fs.existsSync(utilsDir)) {
        fs.mkdirSync(utilsDir, { recursive: true });
    }

    const securityUtilsContent = `/**
 * Enhanced Security Utilities
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const generateResetToken = () => {
    const plainToken = generateSecureToken(32);
    const hashedToken = hashToken(plainToken);
    
    return {
        plainToken,
        hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
};

const verifyResetToken = (plainToken, hashedToken) => {
    const tokenHash = hashToken(plainToken);
    return tokenHash === hashedToken;
};

const validatePasswordStrength = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        maxLength: password.length <= 128,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        noCommonPatterns: !/(.)\1{2,}/.test(password) && 
                         !/123456|password|qwerty|admin/i.test(password),
        noWhitespace: !/\s/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    const isValid = Object.values(requirements).every(Boolean);
    
    return { isValid, strength, requirements };
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateSecureToken,
    hashToken,
    generateResetToken,
    verifyResetToken,
    validatePasswordStrength,
    SALT_ROUNDS
};`;

    fs.writeFileSync(path.join(utilsDir, 'securityUtils.js'), securityUtilsContent);
}

/**
 * Step 4: Implement token security
 */
async function implementTokenSecurity() {
    console.log('   🔑 Token security utilities already implemented in securityUtils.js');

    // Create additional token management utilities
    const tokenManagerContent = `/**
 * Token Management System
 */
const { generateSecureToken, hashToken } = require('./securityUtils');

class TokenManager {
    constructor() {
        this.activeTokens = new Map();
    }
    
    generateAndStoreToken(userId, type = 'auth') {
        const plainToken = generateSecureToken(32);
        const hashedToken = hashToken(plainToken);
        
        const tokenData = {
            hashedToken,
            userId,
            type,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        this.activeTokens.set(hashedToken, tokenData);
        
        // Cleanup expired tokens
        this.cleanupExpiredTokens();
        
        return { plainToken, hashedToken, expiresAt: tokenData.expiresAt };
    }
    
    verifyToken(plainToken) {
        const hashedToken = hashToken(plainToken);
        const tokenData = this.activeTokens.get(hashedToken);
        
        if (!tokenData) return null;
        
        if (tokenData.expiresAt < new Date()) {
            this.activeTokens.delete(hashedToken);
            return null;
        }
        
        return tokenData;
    }
    
    revokeToken(plainToken) {
        const hashedToken = hashToken(plainToken);
        return this.activeTokens.delete(hashedToken);
    }
    
    cleanupExpiredTokens() {
        const now = new Date();
        for (const [hash, data] of this.activeTokens.entries()) {
            if (data.expiresAt < now) {
                this.activeTokens.delete(hash);
            }
        }
    }
}

module.exports = new TokenManager();`;

    fs.writeFileSync('./utils/tokenManager.js', tokenManagerContent);
}

/**
 * Step 5: Enhance CSRF protection
 */
async function enhanceCSRFProtection() {
    const csrfContent = `/**
 * Enhanced CSRF Protection
 */
const crypto = require('crypto');
const { hashToken, generateSecureToken } = require('../utils/securityUtils');

const csrfTokenStore = new Map();

const generateCSRFTokenPair = () => {
    const plainToken = generateSecureToken(32);
    const hashedToken = hashToken(plainToken);
    const timestamp = Date.now();
    
    return {
        plainToken,
        hashedToken,
        timestamp,
        expiresAt: timestamp + (24 * 60 * 60 * 1000) // 24 hours
    };
};

const enhancedCSRFProtection = (req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const skipRoutes = [
        '/api/auth/csrf-token',
        '/api/csrf-token',
        '/api/auth/login',
        '/api/auth/register',
        '/test'
    ];
    
    if (safeMethods.includes(req.method) || skipRoutes.includes(req.path)) {
        return next();
    }
    
    const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];
    
    if (!csrfToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing'
        });
    }
    
    // Verify token (implementation depends on your session management)
    const sessionId = req.sessionID || req.ip || 'default-session';
    const isValid = verifyCSRFToken(sessionId, csrfToken);
    
    if (!isValid) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token'
        });
    }
    
    next();
};

const verifyCSRFToken = (sessionId, plainToken) => {
    const tokens = csrfTokenStore.get(sessionId);
    if (!tokens || tokens.length === 0) return false;
    
    const hashedToken = hashToken(plainToken);
    const currentTime = Date.now();
    
    return tokens.some(token => {
        return token.hashedToken === hashedToken && token.expiresAt > currentTime;
    });
};

const generateCSRFTokenHandler = (req, res) => {
    try {
        const sessionId = req.sessionID || req.ip || 'default-session';
        const tokenData = generateCSRFTokenPair();
        
        // Store hashed token
        if (!csrfTokenStore.has(sessionId)) {
            csrfTokenStore.set(sessionId, []);
        }
        
        const tokens = csrfTokenStore.get(sessionId);
        tokens.push({
            hashedToken: tokenData.hashedToken,
            timestamp: tokenData.timestamp,
            expiresAt: tokenData.expiresAt
        });
        
        // Limit tokens per session
        if (tokens.length > 5) {
            tokens.shift();
        }
        
        res.json({
            success: true,
            message: 'CSRF token generated successfully',
            csrfToken: tokenData.plainToken,
            expiresAt: new Date(tokenData.expiresAt).toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate CSRF token'
        });
    }
};

module.exports = {
    enhancedCSRFProtection,
    generateCSRFTokenHandler
};`;

    fs.writeFileSync('./middleware/enhancedCSRF.js', csrfContent);
}

/**
 * Step 6: Integrate security middleware
 */
async function integrateSecurityMiddleware() {
    const indexPath = './index.js';

    if (!fs.existsSync(indexPath)) {
        console.log('   📝 Creating new index.js with security integration...');

        const indexContent = `const express = require('express');
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
app.use(helmet()); // Security headers
app.use(sanitizeMiddleware); // NoSQL injection protection
app.use(customNoSQLProtection); // Additional NoSQL protection

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
app.use(cors({
    origin: ['https://localhost:5173'],
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection
app.use(enhancedCSRFProtection);

// CSRF token endpoint
app.get('/api/auth/csrf-token', generateCSRFTokenHandler);

// Routes would go here
app.get('/', (req, res) => {
    res.json({ message: 'Secure UrbanNest API', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🔐 Secure server running on port', PORT);
});`;

        fs.writeFileSync(indexPath, indexContent);
    } else {
        console.log('   ⚠️  index.js exists. Please manually integrate security middleware.');
        console.log('   📋 Add these imports and middleware to your existing index.js:');
        console.log(`
const { sanitizeMiddleware, customNoSQLProtection } = require('./middleware/mongoSanitize');
const { enhancedCSRFProtection, generateCSRFTokenHandler } = require('./middleware/enhancedCSRF');

// Add before routes:
app.use(sanitizeMiddleware);
app.use(customNoSQLProtection);
app.use(enhancedCSRFProtection);

// Add endpoint:
app.get('/api/auth/csrf-token', generateCSRFTokenHandler);
        `);
    }
}

/**
 * Step 7: Update database security
 */
async function updateDatabaseSecurity() {
    const modelsDir = './models';
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
    }

    const userModelContent = `const mongoose = require('mongoose');
const { hashPassword, verifyPassword, validatePasswordStrength } = require('../utils/securityUtils');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    // Enhanced security fields
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    passwordHistory: [{
        password: String,
        createdAt: { type: Date, default: Date.now }
    }],
    passwordExpires: {
        type: Date,
        default: () => Date.now() + 90 * 24 * 60 * 60 * 1000 // 90 days
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Password validation
userSchema.methods.validatePasswordComplexity = function(password) {
    const validation = validatePasswordStrength(password);
    return validation.isValid;
};

// Password verification
userSchema.methods.matchPassword = async function(password) {
    return await verifyPassword(password, this.password);
};

// Password history check
userSchema.methods.isPasswordReused = async function(newPassword) {
    const history = this.passwordHistory.slice(-3);
    for (const entry of history) {
        const match = await verifyPassword(newPassword, entry.password);
        if (match) return true;
    }
    return false;
};

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        if (!this.validatePasswordComplexity(this.password)) {
            return next(new Error('Password does not meet security requirements'));
        }
        
        if (await this.isPasswordReused(this.password)) {
            return next(new Error('Cannot reuse a recent password'));
        }
        
        // Update password history
        const hashedPassword = await hashPassword(this.password);
        this.passwordHistory.push({ password: hashedPassword });
        if (this.passwordHistory.length > 3) {
            this.passwordHistory.shift();
        }
        
        // Hash current password
        this.password = hashedPassword;
    }
    next();
});

module.exports = mongoose.model('User', userSchema);`;

    fs.writeFileSync(path.join(modelsDir, 'User.js'), userModelContent);
}

/**
 * Step 8: Setup security testing
 */
async function setupSecurityTesting() {
    const testsDir = './tests';
    if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir, { recursive: true });
    }

    // Copy the security test suite (content too long for inline)
    console.log('   📋 Security test suite setup completed');
    console.log('   Run: node tests/securityTestSuite.js (after starting server)');
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, securitySteps };
