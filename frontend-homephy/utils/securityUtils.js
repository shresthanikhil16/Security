/**
 * Secure Password and Token Hashing Utilities
 * Implements best practices for password storage and token security
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Password Hashing Configuration
 */
const SALT_ROUNDS = 12; // Higher salt rounds for better security (but slower)
const PASSWORD_HISTORY_LIMIT = 5; // Number of previous passwords to remember

/**
 * Hash a password securely with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('🔐 Password hashed successfully with salt rounds:', SALT_ROUNDS);
        return hashedPassword;
    } catch (error) {
        console.error('❌ Password hashing failed:', error);
        throw new Error('Password hashing failed');
    }
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async (password, hash) => {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        console.log('🔍 Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
        return isMatch;
    } catch (error) {
        console.error('❌ Password verification failed:', error);
        return false;
    }
};

/**
 * Generate a secure cryptographic token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
const generateSecureToken = (length = 32) => {
    try {
        const token = crypto.randomBytes(length).toString('hex');
        console.log('🎲 Secure token generated with length:', length * 2, 'characters');
        return token;
    } catch (error) {
        console.error('❌ Token generation failed:', error);
        throw new Error('Token generation failed');
    }
};

/**
 * Hash a token using SHA-256
 * @param {string} token - Plain token
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        console.log('🔐 Token hashed with SHA-256');
        return hashedToken;
    } catch (error) {
        console.error('❌ Token hashing failed:', error);
        throw new Error('Token hashing failed');
    }
};

/**
 * Generate and hash a reset token
 * @returns {Object} - Object containing plain token and hashed token
 */
const generateResetToken = () => {
    try {
        const plainToken = generateSecureToken(32);
        const hashedToken = hashToken(plainToken);

        return {
            plainToken,
            hashedToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        };
    } catch (error) {
        console.error('❌ Reset token generation failed:', error);
        throw new Error('Reset token generation failed');
    }
};

/**
 * Verify a reset token against its hash
 * @param {string} plainToken - Plain token from URL
 * @param {string} hashedToken - Stored hashed token
 * @returns {boolean} - True if token matches
 */
const verifyResetToken = (plainToken, hashedToken) => {
    try {
        const tokenHash = hashToken(plainToken);
        const isValid = tokenHash === hashedToken;
        console.log('🔍 Reset token verification:', isValid ? 'SUCCESS' : 'FAILED');
        return isValid;
    } catch (error) {
        console.error('❌ Reset token verification failed:', error);
        return false;
    }
};

/**
 * Generate a secure OTP (One-Time Password)
 * @param {number} length - OTP length (default: 6)
 * @returns {string} - Numeric OTP
 */
const generateSecureOTP = (length = 6) => {
    try {
        const digits = '0123456789';
        let otp = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            otp += digits[randomIndex];
        }

        console.log('🔑 Secure OTP generated with length:', length);
        return otp;
    } catch (error) {
        console.error('❌ OTP generation failed:', error);
        throw new Error('OTP generation failed');
    }
};

/**
 * Hash an OTP for secure storage
 * @param {string} otp - Plain OTP
 * @returns {string} - Hashed OTP
 */
const hashOTP = (otp) => {
    try {
        // Use a lighter hash for OTPs since they're short-lived
        const hashedOTP = crypto.createHash('sha256').update(otp + process.env.OTP_SECRET || 'default_otp_secret').digest('hex');
        console.log('🔐 OTP hashed with SHA-256');
        return hashedOTP;
    } catch (error) {
        console.error('❌ OTP hashing failed:', error);
        throw new Error('OTP hashing failed');
    }
};

/**
 * Verify an OTP against its hash
 * @param {string} plainOTP - Plain OTP from user
 * @param {string} hashedOTP - Stored hashed OTP
 * @returns {boolean} - True if OTP matches
 */
const verifyOTP = (plainOTP, hashedOTP) => {
    try {
        const otpHash = hashOTP(plainOTP);
        const isValid = otpHash === hashedOTP;
        console.log('🔍 OTP verification:', isValid ? 'SUCCESS' : 'FAILED');
        return isValid;
    } catch (error) {
        console.error('❌ OTP verification failed:', error);
        return false;
    }
};

/**
 * Password strength validation
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with details
 */
const validatePasswordStrength = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        maxLength: password.length <= 128,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        noCommonPatterns: !/(.)\1{2,}/.test(password) && // No repeated characters
            !/123456|password|qwerty|admin/i.test(password), // No common patterns
        noWhitespace: !/\s/.test(password)
    };

    const strength = Object.values(requirements).filter(Boolean).length;
    const isValid = Object.values(requirements).every(Boolean);

    return {
        isValid,
        strength,
        requirements,
        score: Math.min(Math.floor(strength / Object.keys(requirements).length * 100), 100)
    };
};

/**
 * Generate secure session token
 * @returns {Object} - Session token data
 */
const generateSessionToken = () => {
    try {
        const sessionToken = generateSecureToken(64);
        const hashedSessionToken = hashToken(sessionToken);

        return {
            plainToken: sessionToken,
            hashedToken: hashedSessionToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
    } catch (error) {
        console.error('❌ Session token generation failed:', error);
        throw new Error('Session token generation failed');
    }
};

/**
 * Secure data encryption for sensitive information
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key (optional)
 * @returns {Object} - Encrypted data with IV
 */
const encryptSensitiveData = (data, key = process.env.ENCRYPTION_KEY || 'default_encryption_key') => {
    try {
        const algorithm = 'aes-256-gcm';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    } catch (error) {
        console.error('❌ Data encryption failed:', error);
        throw new Error('Data encryption failed');
    }
};

/**
 * Secure data decryption
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} key - Decryption key (optional)
 * @returns {string} - Decrypted data
 */
const decryptSensitiveData = (encryptedData, key = process.env.ENCRYPTION_KEY || 'default_encryption_key') => {
    try {
        const algorithm = 'aes-256-gcm';
        const decipher = crypto.createDecipher(algorithm, key);

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('❌ Data decryption failed:', error);
        throw new Error('Data decryption failed');
    }
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateSecureToken,
    hashToken,
    generateResetToken,
    verifyResetToken,
    generateSecureOTP,
    hashOTP,
    verifyOTP,
    validatePasswordStrength,
    generateSessionToken,
    encryptSensitiveData,
    decryptSensitiveData,
    SALT_ROUNDS,
    PASSWORD_HISTORY_LIMIT
};
