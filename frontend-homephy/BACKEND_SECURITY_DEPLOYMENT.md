# Backend Security Deployment Guide

## 🔐 Comprehensive Security Implementation

This guide provides step-by-step instructions to implement enterprise-grade security for the UrbanNest backend application.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Navigate to backend directory
cd ../backend

# Install security dependencies
npm install express-mongo-sanitize bcryptjs helmet express-rate-limit

# Install additional security packages
npm install express-validator cookie-parser jsonwebtoken
```

### 2. Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/urbannest

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
BCRYPT_SALT_ROUNDS=12
TOKEN_EXPIRY=24h

# CSRF Protection
CSRF_SECRET=your-csrf-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
NODE_ENV=production
PORT=3000
```

## 🚀 Implementation Steps

### Step 1: Copy Security Files

Copy the following files from frontend/src/hooks to backend:

1. **Backend Middleware** (create `middleware/` directory):
   - `mongoSanitize.js` → NoSQL injection protection
   - `enhancedCSRF.js` → Enhanced CSRF protection

2. **Backend Utils** (create `utils/` directory):
   - `securityUtils.js` → Password & token utilities
   - `tokenManager.js` → Token management system

3. **Backend Models** (update `models/` directory):
   - `User.js` → Enhanced user model with security

### Step 2: Update Main Server File

```javascript
// index.js or app.js
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

// Security middleware (order matters!)
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

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CSRF protection
app.use(enhancedCSRFProtection);

// Security endpoints
app.get('/api/auth/csrf-token', generateCSRFTokenHandler);

// Your existing routes...
```

### Step 3: Update Authentication Routes

```javascript
// routes/auth.js
const express = require('express');
const User = require('../models/User');
const { hashPassword, verifyPassword, generateResetToken, verifyResetToken } = require('../utils/securityUtils');
const tokenManager = require('../utils/tokenManager');

const router = express.Router();

// Enhanced login with security
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Find user with password field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(423).json({
                success: false,
                message: 'Account temporarily locked due to multiple failed attempts'
            });
        }
        
        // Verify password
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            // Increment login attempts
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
            }
            await user.save();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
        
        // Generate secure token
        const { plainToken } = tokenManager.generateAndStoreToken(user._id, 'auth');
        
        res.json({
            success: true,
            message: 'Login successful',
            token: plainToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Enhanced password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists
            return res.json({
                success: true,
                message: 'If an account with that email exists, a reset link has been sent'
            });
        }
        
        // Generate secure reset token
        const { plainToken, hashedToken, expiresAt } = generateResetToken();
        
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = expiresAt;
        await user.save();
        
        // Send email (implement your email service)
        // await sendResetEmail(user.email, plainToken);
        
        res.json({
            success: true,
            message: 'Password reset link sent to your email'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
```

### Step 4: Database Connection Security

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Security options
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            bufferMaxEntries: 0
        });
        
        console.log('🔐 MongoDB Connected Securely:', conn.connection.host);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
```

## 🧪 Security Testing

### Run Security Test Suite
```bash
# Start your server first
npm start

# In another terminal, run security tests
node tests/securityTestSuite.js
```

### Manual Security Checks

1. **NoSQL Injection Test**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": "test"}'
```

2. **CSRF Protection Test**:
```bash
curl -X POST http://localhost:3000/api/protected-route \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

3. **Rate Limiting Test**:
```bash
for i in {1..110}; do curl http://localhost:3000/api/test; done
```

## 📊 Security Monitoring

### Security Headers Check
Use online tools to verify security headers:
- https://securityheaders.com/
- https://observatory.mozilla.org/

### Password Security Audit
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, special characters
- Cannot reuse last 3 passwords
- Password expires every 90 days

### Token Security
- All tokens are SHA-256 hashed before storage
- Automatic token cleanup and rotation
- 24-hour token expiration
- Single-use reset tokens

## 🚨 Security Checklist

- [ ] All dependencies updated to latest versions
- [ ] Environment variables properly configured
- [ ] HTTPS enabled in production
- [ ] Database connection secured
- [ ] Rate limiting configured
- [ ] CSRF protection active
- [ ] NoSQL injection protection enabled
- [ ] Password hashing with bcrypt (12 salt rounds)
- [ ] Secure token generation and storage
- [ ] Input validation on all endpoints
- [ ] Security headers configured
- [ ] Error handling doesn't leak sensitive information
- [ ] Logging configured for security events
- [ ] Security tests passing

## 🔄 Maintenance

### Regular Security Tasks
1. **Weekly**: Review security logs for suspicious activity
2. **Monthly**: Update dependencies and check for vulnerabilities
3. **Quarterly**: Security audit and penetration testing
4. **Annually**: Complete security architecture review

### Monitoring Alerts
Set up alerts for:
- Failed login attempts (>5 in 15 minutes)
- NoSQL injection attempts
- Rate limit violations
- CSRF token failures
- Unexpected server errors

---

## 📞 Support

For security-related questions or issues:
1. Check the security logs first
2. Review this implementation guide
3. Run the security test suite
4. Contact the development team

**Remember**: Security is an ongoing process, not a one-time implementation!
