# Security Implementation Guide for Homefy Backend

## Overview
This guide implements comprehensive security measures including password hashing, token hashing, and NoSQL injection prevention with mongo-sanitize middleware.

## 🛡️ Security Features Implemented

### 1. Password Security
- **Bcrypt Hashing**: All passwords are hashed with salt rounds of 12
- **Password History**: Prevents reuse of last 5 passwords
- **Password Complexity**: Enforces strong password requirements
- **Password Expiration**: Passwords expire after 90 days

### 2. Token Security
- **SHA-256 Hashing**: All tokens are hashed before storage
- **Secure Token Generation**: Uses crypto.randomBytes for token generation
- **Token Expiration**: All tokens have appropriate expiration times
- **Single-Use Tokens**: Reset tokens are invalidated after use

### 3. NoSQL Injection Prevention
- **Mongo-Sanitize**: Strips $ and . characters from user input
- **Input Validation**: Comprehensive validation of all user inputs
- **Pattern Detection**: Detects and blocks common NoSQL injection patterns

### 4. Enhanced CSRF Protection
- **Token Hashing**: CSRF tokens are hashed before storage
- **Token Rotation**: Tokens are rotated periodically
- **Session Management**: Secure session-based token management

## 📦 Required Dependencies

Add these to your backend package.json:

```json
{
  "dependencies": {
    "express-mongo-sanitize": "^2.2.0",
    "bcryptjs": "^2.4.3",
    "crypto": "^1.0.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  }
}
```

## 🔧 Implementation Steps

### Step 1: Install Dependencies
```bash
cd backend-urbannest
npm install express-mongo-sanitize bcryptjs helmet express-rate-limit
```

### Step 2: Update Main Server File (index.js)
```javascript
// Add these imports at the top
const { sanitizeMiddleware, customNoSQLProtection, detectNoSQLInjection } = require('./middleware/mongoSanitize');
const { enhancedCSRFProtection, generateCSRFTokenHandler } = require('./middleware/enhancedCSRF');

// Add security middleware before routes
app.use(sanitizeMiddleware); // MongoDB injection protection
app.use(customNoSQLProtection); // Additional NoSQL protection
app.use(detectNoSQLInjection); // Pattern detection

// Replace existing CSRF protection with enhanced version
app.use(enhancedCSRFProtection);

// Enhanced CSRF token endpoint
app.get("/api/auth/csrf-token", generateCSRFTokenHandler);
```

### Step 3: Update User Model (models/User.js)
```javascript
const { hashPassword, verifyPassword, validatePasswordStrength } = require('../utils/securityUtils');

// Replace existing password hashing with secure implementation
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Validate password strength
    const validation = validatePasswordStrength(this.password);
    if (!validation.isValid) {
      return next(new Error('Password does not meet security requirements'));
    }
    
    // Hash password securely
    this.password = await hashPassword(this.password);
  }
  next();
});

// Add password verification method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await verifyPassword(enteredPassword, this.password);
};
```

### Step 4: Update Auth Controller (controllers/authController.js)
```javascript
const { 
  generateResetToken, 
  verifyResetToken, 
  generateSecureOTP, 
  hashOTP, 
  verifyOTP 
} = require('../utils/securityUtils');
const { manualSanitize } = require('../middleware/mongoSanitize');

// Update forgot password to use secure tokens
const forgotPassword = async (req, res) => {
  const { email } = manualSanitize(req.body);
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate secure reset token
    const { plainToken, hashedToken, expiresAt } = generateResetToken();
    
    // Store hashed token
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Send email with plain token
    const resetUrl = `https://localhost:5173/reset-password?token=${plainToken}`;
    await sendEmail(
      email,
      "Secure Password Reset",
      `<p>Click <a href="${resetUrl}">here</a> to reset your password securely.</p>
       <p>This link expires in 1 hour.</p>`
    );

    res.status(200).json({
      success: true,
      message: "Secure reset link sent to your email"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Error sending reset email" });
  }
};

// Update reset password to verify hashed tokens
const resetPassword = async (req, res) => {
  const { token, newPassword } = manualSanitize(req.body);
  
  try {
    // Find user with non-expired reset token
    const users = await User.find({
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    let user = null;
    for (const u of users) {
      if (verifyResetToken(token, u.resetPasswordToken)) {
        user = u;
        break;
      }
    }
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Validate new password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements"
      });
    }

    // Update password and clear reset token
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Error resetting password" });
  }
};
```

### Step 5: Add Database Schema Updates
```javascript
// Add to User schema in models/User.js
resetPasswordToken: {
  type: String,
  select: false // Don't include in queries by default
},
resetPasswordExpires: {
  type: Date,
  select: false
},
loginAttempts: {
  type: Number,
  default: 0
},
lockUntil: {
  type: Date
}
```

## 🔍 Security Verification

### Test NoSQL Injection Protection
```bash
# This should be blocked
curl -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": {"$ne": null}}'
```

### Test Password Hashing
```javascript
// Check in MongoDB - passwords should be hashed
db.users.findOne({}, {password: 1})
// Should see: { "password": "$2b$12$..." }
```

### Test Token Security
```javascript
// Check reset tokens in database - should be hashed
db.users.findOne({}, {resetPasswordToken: 1})
// Should see: { "resetPasswordToken": "a1b2c3d4..." } (SHA-256 hash)
```

## 📊 Security Monitoring

### Enable Security Logging
```javascript
// Add to your logging system
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
securityLogger.info('Password reset attempt', { 
  email: user.email, 
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

## 🚨 Security Alerts

### Set Up Monitoring for:
1. Multiple failed login attempts
2. NoSQL injection attempts
3. Invalid token usage
4. Suspicious password reset patterns
5. Unusual authentication patterns

## 📋 Security Checklist

- [ ] All passwords are hashed with bcrypt (salt rounds >= 12)
- [ ] All tokens are hashed with SHA-256 before storage
- [ ] MongoDB injection protection is active
- [ ] Input validation is comprehensive
- [ ] CSRF protection is enhanced
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] Security logging is active
- [ ] Password complexity is enforced
- [ ] Token expiration is implemented

## 🔄 Regular Maintenance

### Weekly Tasks:
- Review security logs
- Update dependencies
- Check for failed authentication attempts

### Monthly Tasks:
- Rotate encryption keys
- Review and update security policies
- Conduct security assessments

## 🆘 Emergency Procedures

### In Case of Security Breach:
1. Immediately disable affected accounts
2. Rotate all tokens and secrets
3. Review access logs
4. Notify users of potential breach
5. Implement additional security measures

## 📞 Support

For security-related questions or concerns:
- Review security logs
- Check implementation against this guide
- Verify all dependencies are updated
- Test security measures regularly

---

**Remember**: Security is an ongoing process. Regular updates and monitoring are essential for maintaining a secure application.
