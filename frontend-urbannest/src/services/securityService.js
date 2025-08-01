/**
 * Frontend Security Configuration
 * Integrates with enhanced backend security features
 */

import axios from 'axios';

/**
 * Enhanced Security Service for Frontend
 */
class SecurityService {
    constructor() {
        this.csrfToken = null;
        this.tokenRefreshInterval = null;
        this.securityHeaders = {};
        this.init();
    }

    /**
     * Initialize security service
     */
    async init() {
        await this.refreshCSRFToken();
        this.setupTokenRefresh();
        this.setupSecureAxios();
        this.setupSecurityHeaders();
    }

    /**
     * Get fresh CSRF token from server
     */
    async refreshCSRFToken() {
        try {
            console.log('🔐 Refreshing CSRF token...');
            const response = await axios.get('https://localhost:3000/api/auth/csrf-token', {
                withCredentials: true
            });

            if (response.data.success && response.data.csrfToken) {
                this.csrfToken = response.data.csrfToken;
                console.log('✅ CSRF token refreshed successfully');

                // Store in localStorage for persistence
                localStorage.setItem('csrfToken', this.csrfToken);
                localStorage.setItem('csrfTokenExpiry', response.data.expiresAt);

                return this.csrfToken;
            } else {
                throw new Error('Failed to get CSRF token from server');
            }
        } catch (error) {
            console.error('❌ CSRF token refresh failed:', error);

            // Fallback to stored token if available
            const storedToken = localStorage.getItem('csrfToken');
            const tokenExpiry = localStorage.getItem('csrfTokenExpiry');

            if (storedToken && tokenExpiry && new Date(tokenExpiry) > new Date()) {
                this.csrfToken = storedToken;
                console.log('📦 Using stored CSRF token');
                return this.csrfToken;
            }

            throw error;
        }
    }

    /**
     * Setup automatic token refresh
     */
    setupTokenRefresh() {
        // Refresh token every 30 minutes
        this.tokenRefreshInterval = setInterval(() => {
            this.refreshCSRFToken().catch(console.error);
        }, 30 * 60 * 1000);
    }

    /**
     * Setup secure axios instance
     */
    setupSecureAxios() {
        // Request interceptor to add security headers
        axios.interceptors.request.use(
            async (config) => {
                // Add CSRF token for non-GET requests
                if (config.method !== 'get') {
                    if (!this.csrfToken) {
                        await this.refreshCSRFToken();
                    }
                    config.headers['X-CSRF-Token'] = this.csrfToken;
                }

                // Add security headers
                config.headers = {
                    ...config.headers,
                    ...this.securityHeaders,
                    'Content-Type': 'application/json',
                };

                // Sanitize request data
                if (config.data) {
                    config.data = this.sanitizeData(config.data);
                }

                return config;
            },
            (error) => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle security errors
        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
                    console.warn('⚠️  CSRF token expired, refreshing...');
                    try {
                        await this.refreshCSRFToken();
                        // Retry the original request
                        error.config.headers['X-CSRF-Token'] = this.csrfToken;
                        return axios.request(error.config);
                    } catch (refreshError) {
                        console.error('❌ Failed to refresh CSRF token:', refreshError);
                    }
                }

                // Handle other security errors
                if (error.response?.status === 429) {
                    console.warn('⚠️  Rate limit exceeded. Please slow down.');
                }

                if (error.response?.status === 401) {
                    console.warn('⚠️  Authentication failed. Redirecting to login.');
                    // Handle authentication failure
                    this.handleAuthFailure();
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Setup security headers
     */
    setupSecurityHeaders() {
        this.securityHeaders = {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
    }

    /**
     * Sanitize input data to prevent XSS and injection attacks
     */
    sanitizeData(data) {
        if (typeof data === 'string') {
            return data
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+\s*=/gi, '') // Remove event handlers
                .replace(/[<>'"]/g, (match) => { // Escape HTML characters
                    const escapeMap = {
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#x27;'
                    };
                    return escapeMap[match];
                });
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const key in data) {
                // Sanitize keys to prevent NoSQL injection
                const cleanKey = key.replace(/[$\.]/g, '');
                if (cleanKey !== key) {
                    console.warn(`⚠️  Suspicious key detected and sanitized: ${key} -> ${cleanKey}`);
                }

                sanitized[cleanKey] = this.sanitizeData(data[key]);
            }
            return sanitized;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }

        return data;
    }

    /**
     * Validate password strength on client side
     */
    validatePasswordStrength(password) {
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

        return {
            isValid,
            strength,
            requirements,
            score: Math.min(Math.floor(strength / Object.keys(requirements).length * 100), 100)
        };
    }

    /**
     * Secure form submission
     */
    async secureSubmit(url, data, options = {}) {
        try {
            // Ensure CSRF token is fresh
            if (!this.csrfToken) {
                await this.refreshCSRFToken();
            }

            // Sanitize data
            const sanitizedData = this.sanitizeData(data);

            // Make secure request
            const response = await axios.post(url, sanitizedData, {
                withCredentials: true,
                timeout: 15000, // 15 second timeout
                ...options
            });

            return response;
        } catch (error) {
            console.error('❌ Secure submit failed:', error);
            throw error;
        }
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure() {
        // Clear stored tokens
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenExpiry');
        localStorage.removeItem('authToken');

        // Clear service state
        this.csrfToken = null;

        // Redirect to login (implement based on your routing)
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }

    /**
     * Secure file upload
     */
    async secureFileUpload(url, file, additionalData = {}) {
        try {
            // Validate file type and size
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
            }

            if (file.size > maxSize) {
                throw new Error('File too large. Maximum size is 5MB.');
            }

            // Create secure form data
            const formData = new FormData();
            formData.append('file', file);

            // Add additional data
            Object.keys(additionalData).forEach(key => {
                formData.append(key, this.sanitizeData(additionalData[key]));
            });

            // Upload with security headers
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-Token': this.csrfToken
                },
                withCredentials: true,
                timeout: 30000 // 30 second timeout for file uploads
            });

            return response;
        } catch (error) {
            console.error('❌ Secure file upload failed:', error);
            throw error;
        }
    }

    /**
     * Generate secure client-side ID
     */
    generateSecureId() {
        return 'id_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Check if current session is secure
     */
    isSecureSession() {
        return {
            hasCSRFToken: !!this.csrfToken,
            isHTTPS: window.location.protocol === 'https:',
            hasSecureHeaders: Object.keys(this.securityHeaders).length > 0,
            tokenExpiry: localStorage.getItem('csrfTokenExpiry')
        };
    }

    /**
     * Cleanup when service is destroyed
     */
    destroy() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }
    }
}

// Create singleton instance
const securityService = new SecurityService();

export default securityService;
