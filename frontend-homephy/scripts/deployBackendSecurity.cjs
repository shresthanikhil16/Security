#!/usr/bin/env node

/**
 * Quick Security Deployment Script for UrbanNest Backend
 * Automates the setup of security middleware and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 UrbanNest Backend Security Deployment\n');

// Check if we're in the right directory structure
const frontendPath = process.cwd();
const backendPath = path.join(frontendPath, '..', 'backend');

console.log('📂 Frontend Path:', frontendPath);
console.log('📂 Backend Path:', backendPath);

if (!fs.existsSync(backendPath)) {
    console.log('⚠️  Backend directory not found. Creating backend structure...');
    
    try {
        fs.mkdirSync(backendPath, { recursive: true });
        console.log('✅ Backend directory created');
    } catch (error) {
        console.error('❌ Failed to create backend directory:', error.message);
        process.exit(1);
    }
}

// Security files to copy
const securityFiles = [
    {
        source: 'src/hooks/mongoSanitize.js',
        target: 'middleware/mongoSanitize.js'
    },
    {
        source: 'src/hooks/enhancedCSRF.js', 
        target: 'middleware/enhancedCSRF.js'
    },
    {
        source: 'src/hooks/securityUtils.js',
        target: 'utils/securityUtils.js'
    },
    {
        source: 'src/hooks/securityTestSuite.js',
        target: 'tests/securityTestSuite.js'
    }
];

// Copy security files to backend
console.log('📋 Copying security files to backend...');

securityFiles.forEach(file => {
    const sourcePath = path.join(frontendPath, file.source);
    const targetPath = path.join(backendPath, file.target);
    const targetDir = path.dirname(targetPath);
    
    try {
        // Create target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy file if source exists
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`   ✅ ${file.source} → ${file.target}`);
        } else {
            console.log(`   ⚠️  ${file.source} not found, skipping...`);
        }
    } catch (error) {
        console.log(`   ❌ Failed to copy ${file.source}: ${error.message}`);
    }
});

// Create package.json if it doesn't exist
const packageJsonPath = path.join(backendPath, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.log('\n📦 Creating backend package.json...');
    
    const packageJson = {
        "name": "urbannest-backend",
        "version": "1.0.0",
        "description": "Secure backend for UrbanNest application",
        "main": "index.js",
        "scripts": {
            "start": "node index.js",
            "dev": "nodemon index.js",
            "test": "jest",
            "security-test": "node tests/securityTestSuite.js"
        },
        "dependencies": {
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
            "cookie-parser": "^1.4.6",
            "express-validator": "^7.0.1"
        },
        "devDependencies": {
            "nodemon": "^3.0.1",
            "jest": "^29.7.0"
        }
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✅ package.json created');
}

// Create basic index.js if it doesn't exist
const indexPath = path.join(backendPath, 'index.js');
if (!fs.existsSync(indexPath)) {
    console.log('\n📄 Creating secure index.js...');
    
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
    console.log(\`🔐 Secure UrbanNest API running on port \${PORT}\`);
    console.log(\`📊 Health check: http://localhost:\${PORT}/api/health\`);
    console.log(\`🔑 CSRF Token: http://localhost:\${PORT}/api/auth/csrf-token\`);
});

module.exports = app;`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('   ✅ Secure index.js created');
}

// Create .env template
const envPath = path.join(backendPath, '.env.example');
if (!fs.existsSync(envPath)) {
    console.log('\n🔧 Creating .env.example...');
    
    const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/urbannest

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
BCRYPT_SALT_ROUNDS=12
TOKEN_EXPIRY=24h

# CSRF Protection
CSRF_SECRET=your-csrf-secret-key-change-this-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=https://localhost:5173

# Security Headers
HELMET_CSP_DEFAULT_SRC="'self'"
HELMET_CSP_STYLE_SRC="'self' 'unsafe-inline'"
HELMET_CSP_IMG_SRC="'self' data: https:"
HELMET_CSP_CONNECT_SRC="'self'"`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('   ✅ .env.example created');
}

// Installation instructions
console.log('\n🚀 Next Steps:');
console.log('\n1. Navigate to backend directory:');
console.log('   cd ../backend');
console.log('\n2. Install dependencies:');
console.log('   npm install');
console.log('\n3. Copy and configure environment:');
console.log('   cp .env.example .env');
console.log('   # Edit .env with your actual values');
console.log('\n4. Start the secure server:');
console.log('   npm start');
console.log('\n5. Test security features:');
console.log('   npm run security-test');
console.log('\n6. Check API health:');
console.log('   curl http://localhost:3000/api/health');

console.log('\n📚 Documentation:');
console.log('   - Read BACKEND_SECURITY_DEPLOYMENT.md for detailed setup');
console.log('   - Review SECURITY_IMPLEMENTATION.md for implementation details');

console.log('\n✨ Security Features Enabled:');
console.log('   🛡️  NoSQL Injection Protection');
console.log('   🔐 Enhanced Password Hashing (bcrypt + salt rounds 12)');
console.log('   🔑 Secure Token Generation & Hashing (SHA-256)');
console.log('   🚨 CSRF Protection with Token Hashing');
console.log('   🔒 Rate Limiting & Security Headers');
console.log('   📝 Input Validation & Sanitization');
console.log('   🧪 Comprehensive Security Testing');

console.log('\n🎉 Security deployment preparation complete!');
console.log('📖 Follow the steps above to complete the backend setup.\n');

process.exit(0);
