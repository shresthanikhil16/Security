/**
 * Enhanced CSRF Protection with Token Hashing
 * Provides secure CSRF token generation, validation, and rotation
 */

const crypto = require('crypto');
const { hashToken, generateSecureToken } = require('../utils/securityUtils');

/**
 * CSRF Configuration
 */
const CSRF_CONFIG = {
    tokenLength: 32,
    cookieAge: 24 * 60 * 60 * 1000, // 24 hours
    tokenRotationInterval: 60 * 60 * 1000, // 1 hour
    maxTokensPerSession: 5
};

/**
 * In-memory token storage (in production, use Redis or database)
 */
const csrfTokenStore = new Map();

/**
 * Generate a secure CSRF token pair
 * @returns {Object} - Object containing plain token and hashed token
 */
const generateCSRFTokenPair = () => {
    try {
        const plainToken = generateSecureToken(CSRF_CONFIG.tokenLength);
        const hashedToken = hashToken(plainToken);
        const timestamp = Date.now();

        return {
            plainToken,
            hashedToken,
            timestamp,
            expiresAt: timestamp + CSRF_CONFIG.cookieAge
        };
    } catch (error) {
        console.error('❌ CSRF token generation failed:', error);
        throw new Error('CSRF token generation failed');
    }
};

/**
 * Store CSRF token in secure storage
 * @param {string} sessionId - Session identifier
 * @param {Object} tokenData - Token data object
 */
const storeCSRFToken = (sessionId, tokenData) => {
    try {
        if (!csrfTokenStore.has(sessionId)) {
            csrfTokenStore.set(sessionId, []);
        }

        const tokens = csrfTokenStore.get(sessionId);

        // Remove expired tokens
        const currentTime = Date.now();
        const validTokens = tokens.filter(token => token.expiresAt > currentTime);

        // Limit number of tokens per session
        if (validTokens.length >= CSRF_CONFIG.maxTokensPerSession) {
            validTokens.shift(); // Remove oldest token
        }

        validTokens.push(tokenData);
        csrfTokenStore.set(sessionId, validTokens);

        console.log('🔐 CSRF token stored for session:', sessionId);
    } catch (error) {
        console.error('❌ CSRF token storage failed:', error);
        throw new Error('CSRF token storage failed');
    }
};

/**
 * Verify CSRF token
 * @param {string} sessionId - Session identifier
 * @param {string} plainToken - Plain token from request
 * @returns {boolean} - True if token is valid
 */
const verifyCSRFToken = (sessionId, plainToken) => {
    try {
        if (!sessionId || !plainToken) {
            console.warn('⚠️  CSRF verification failed: Missing session ID or token');
            return false;
        }

        const tokens = csrfTokenStore.get(sessionId);
        if (!tokens || tokens.length === 0) {
            console.warn('⚠️  CSRF verification failed: No tokens found for session');
            return false;
        }

        const currentTime = Date.now();
        const hashedToken = hashToken(plainToken);

        // Check if any stored token matches
        const isValid = tokens.some(token => {
            const isMatch = token.hashedToken === hashedToken;
            const isNotExpired = token.expiresAt > currentTime;
            return isMatch && isNotExpired;
        });

        if (isValid) {
            console.log('✅ CSRF token verification successful');

            // Optional: Remove used token (one-time use)
            // This makes tokens single-use for maximum security
            const updatedTokens = tokens.filter(token => token.hashedToken !== hashedToken);
            csrfTokenStore.set(sessionId, updatedTokens);
        } else {
            console.warn('⚠️  CSRF verification failed: Invalid or expired token');
        }

        return isValid;
    } catch (error) {
        console.error('❌ CSRF token verification failed:', error);
        return false;
    }
};

/**
 * Enhanced CSRF protection middleware
 */
const enhancedCSRFProtection = (req, res, next) => {
    try {
        // Skip CSRF for safe methods and specific routes
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        const skipRoutes = [
            '/api/auth/csrf-token',
            '/api/csrf-token',
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/verify-otp',
            '/test'
        ];

        if (safeMethods.includes(req.method) || skipRoutes.includes(req.path)) {
            return next();
        }

        // Extract session ID (you might use different session management)
        const sessionId = req.sessionID || req.ip || 'default-session';

        // Extract CSRF token from various sources
        const csrfToken = req.headers['x-csrf-token'] ||
            req.headers['csrf-token'] ||
            req.body._csrf ||
            req.query._csrf;

        if (!csrfToken) {
            console.warn('⚠️  CSRF protection: No token provided');
            return res.status(403).json({
                success: false,
                message: 'CSRF token missing',
                error: 'CSRF protection requires a valid token'
            });
        }

        // Verify the token
        const isValidToken = verifyCSRFToken(sessionId, csrfToken);

        if (!isValidToken) {
            console.warn('⚠️  CSRF protection: Invalid token provided');
            return res.status(403).json({
                success: false,
                message: 'Invalid CSRF token',
                error: 'CSRF token verification failed'
            });
        }

        // Token is valid, proceed
        next();
    } catch (error) {
        console.error('❌ CSRF protection middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'CSRF protection error',
            error: 'Internal server error'
        });
    }
};

/**
 * Generate CSRF token endpoint handler
 */
const generateCSRFTokenHandler = (req, res) => {
    try {
        const sessionId = req.sessionID || req.ip || 'default-session';
        const tokenData = generateCSRFTokenPair();

        // Store the hashed token
        storeCSRFToken(sessionId, {
            hashedToken: tokenData.hashedToken,
            timestamp: tokenData.timestamp,
            expiresAt: tokenData.expiresAt
        });

        // Set secure cookie with additional options
        res.cookie('csrf-token', tokenData.plainToken, {
            httpOnly: false, // Needs to be accessible by JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict', // CSRF protection
            maxAge: CSRF_CONFIG.cookieAge,
            path: '/'
        });

        res.json({
            success: true,
            message: 'CSRF token generated successfully',
            csrfToken: tokenData.plainToken,
            expiresAt: new Date(tokenData.expiresAt).toISOString()
        });

        console.log('✅ CSRF token generated and sent for session:', sessionId);
    } catch (error) {
        console.error('❌ CSRF token generation handler error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate CSRF token',
            error: 'Internal server error'
        });
    }
};

/**
 * Clean up expired tokens (should be called periodically)
 */
const cleanupExpiredTokens = () => {
    try {
        const currentTime = Date.now();
        let cleanedSessions = 0;
        let cleanedTokens = 0;

        for (const [sessionId, tokens] of csrfTokenStore.entries()) {
            const validTokens = tokens.filter(token => token.expiresAt > currentTime);
            cleanedTokens += tokens.length - validTokens.length;

            if (validTokens.length === 0) {
                csrfTokenStore.delete(sessionId);
                cleanedSessions++;
            } else {
                csrfTokenStore.set(sessionId, validTokens);
            }
        }

        console.log(`🧹 CSRF cleanup: Removed ${cleanedTokens} expired tokens from ${cleanedSessions} sessions`);
    } catch (error) {
        console.error('❌ CSRF token cleanup failed:', error);
    }
};

/**
 * Get CSRF token statistics
 */
const getCSRFStats = () => {
    try {
        const stats = {
            totalSessions: csrfTokenStore.size,
            totalTokens: 0,
            expiredTokens: 0
        };

        const currentTime = Date.now();

        for (const tokens of csrfTokenStore.values()) {
            stats.totalTokens += tokens.length;
            stats.expiredTokens += tokens.filter(token => token.expiresAt <= currentTime).length;
        }

        return stats;
    } catch (error) {
        console.error('❌ CSRF stats generation failed:', error);
        return null;
    }
};

// Set up periodic cleanup (every hour)
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
    enhancedCSRFProtection,
    generateCSRFTokenHandler,
    generateCSRFTokenPair,
    storeCSRFToken,
    verifyCSRFToken,
    cleanupExpiredTokens,
    getCSRFStats,
    CSRF_CONFIG
};
