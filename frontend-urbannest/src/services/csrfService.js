import axios from 'axios';

class CSRFService {
    constructor() {
        this.csrfToken = null;
        this.baseURL = 'https://localhost:3000';
        this.csrfEnabled = null; // null = unknown, true = enabled, false = disabled
        this.tokenRefreshInterval = null;
        this.failureCount = 0;
        this.maxFailures = 3;
    }

    // Enhanced CSRF token fetching with security improvements
    async getCSRFToken() {
        try {
            const url = `${this.baseURL}/api/auth/csrf-token`;
            console.log('🔐 Attempting to fetch enhanced CSRF token from:', url);

            const response = await axios.get(url, {
                withCredentials: true,
                timeout: 10000, // 10 second timeout
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success && response.data.csrfToken) {
                this.csrfToken = response.data.csrfToken;
                this.csrfEnabled = true;
                this.failureCount = 0; // Reset failure count on success

                // Store token with expiry
                if (response.data.expiresAt) {
                    localStorage.setItem('csrfToken', this.csrfToken);
                    localStorage.setItem('csrfTokenExpiry', response.data.expiresAt);
                }

                console.log('✅ Enhanced CSRF protection enabled');
                this.setupAutoRefresh();
                return this.csrfToken;
            } else {
                throw new Error('Invalid CSRF token response format');
            }
        } catch (error) {
            this.failureCount++;
            console.warn(`⚠️  CSRF token request failed (attempt ${this.failureCount}/${this.maxFailures}):`, error.message);

            if (error.response?.status === 404) {
                console.warn('🚫 CSRF endpoint not found. Running without CSRF protection.');
                this.csrfEnabled = false;
                this.csrfToken = null;
                return null;
            }

            // Try to use stored token if available and not expired
            const storedToken = localStorage.getItem('csrfToken');
            const tokenExpiry = localStorage.getItem('csrfTokenExpiry');

            if (storedToken && tokenExpiry && new Date(tokenExpiry) > new Date()) {
                console.log('📦 Using stored CSRF token as fallback');
                this.csrfToken = storedToken;
                this.csrfEnabled = true;
                return this.csrfToken;
            }

            if (this.failureCount >= this.maxFailures) {
                console.error('❌ Max CSRF token failures reached. Disabling CSRF protection.');
                this.csrfEnabled = false;
                this.csrfToken = null;
                return null;
            }

            throw error;
        }
    }

    // Setup automatic token refresh
    setupAutoRefresh() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }

        // Refresh token every 30 minutes (tokens are valid for 1 hour)
        this.tokenRefreshInterval = setInterval(async () => {
            try {
                console.log('🔄 Auto-refreshing CSRF token...');
                await this.getCSRFToken();
            } catch (error) {
                console.error('❌ Auto-refresh failed:', error);
            }
        }, 30 * 60 * 1000);
    }

    // Enhanced secure axios instance with additional security features
    async createSecureAxiosInstance() {
        try {
            // Try to get CSRF token, but don't fail if not available
            if (this.csrfEnabled === null) {
                await this.getCSRFToken();
            }

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // CSRF protection
            };

            // Only add CSRF token if CSRF is enabled
            if (this.csrfEnabled && this.csrfToken) {
                headers['X-CSRF-Token'] = this.csrfToken;
                headers['x-csrf-token'] = this.csrfToken; // Standard header name (lowercase)
            }

            const instance = axios.create({
                baseURL: this.baseURL,
                withCredentials: this.csrfEnabled || false,
                headers,
                timeout: 15000, // 15 second timeout
                maxRedirects: 0 // Prevent redirect attacks
            });

            // Enhanced request interceptor with input sanitization
            instance.interceptors.request.use(
                async (config) => {
                    // Add auth token if available
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (user.token) {
                        config.headers.Authorization = `Bearer ${user.token}`;
                    }

                    // Add CSRF token only if CSRF is enabled
                    if (this.csrfEnabled && this.csrfToken) {
                        config.headers['X-CSRF-Token'] = this.csrfToken;
                    }

                    // Sanitize request data to prevent injection attacks
                    if (config.data) {
                        config.data = this.sanitizeRequestData(config.data);
                    }

                    // Add security timestamp
                    config.headers['X-Request-Time'] = new Date().toISOString();

                    return config;
                },
                (error) => {
                    console.error('❌ Request interceptor error:', error);
                    return Promise.reject(error);
                }
            );

            // Enhanced response interceptor with security error handling
            instance.interceptors.response.use(
                (response) => {
                    // Log successful requests for monitoring
                    if (response.config.method !== 'get') {
                        console.log('✅ Secure request completed:', response.config.url);
                    }
                    return response;
                },
                async (error) => {
                    const { response, config } = error;

                    // Handle CSRF token errors
                    if (this.csrfEnabled && response?.status === 403) {
                        if (response.data?.message?.includes('CSRF') ||
                            response.data?.error?.includes('CSRF')) {
                            console.warn('⚠️  CSRF token invalid/expired, attempting refresh...');
                            try {
                                await this.getCSRFToken();
                                if (this.csrfToken && !config._retry) {
                                    config._retry = true;
                                    config.headers['X-CSRF-Token'] = this.csrfToken;
                                    return instance.request(config);
                                }
                            } catch (refreshError) {
                                console.error('❌ Failed to refresh CSRF token:', refreshError);
                            }
                        }
                    }

                    // Handle rate limiting
                    if (response?.status === 429) {
                        console.warn('⚠️  Rate limit exceeded. Please slow down.');
                        const retryAfter = response.headers['retry-after'];
                        if (retryAfter && !config._retry) {
                            config._retry = true;
                            const delay = parseInt(retryAfter) * 1000;
                            console.log(`⏳ Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return instance.request(config);
                        }
                    }

                    // Handle authentication errors
                    if (response?.status === 401) {
                        console.warn('⚠️  Authentication failed');
                        this.handleAuthFailure();
                    }

                    // Handle server errors with security implications
                    if (response?.status >= 500) {
                        console.error('❌ Server error detected:', response.status);
                        // Don't expose internal errors to console in production
                        if (process.env.NODE_ENV === 'production') {
                            error.message = 'Server error occurred';
                        }
                    }

                    return Promise.reject(error);
                }
            );

            console.log('✅ Enhanced secure axios instance created', {
                csrfEnabled: this.csrfEnabled,
                hasToken: !!this.csrfToken,
                autoRefresh: !!this.tokenRefreshInterval
            });
            return instance;
        } catch (error) {
            console.error('❌ Failed to create secure axios instance:', error);
            // Return a basic axios instance as fallback
            return axios.create({
                baseURL: this.baseURL,
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000
            });
        }
    }

    // Sanitize request data to prevent injection attacks
    sanitizeRequestData(data) {
        if (typeof data === 'string') {
            return data
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/[<>'"]/g, (match) => {
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
                // Remove potential NoSQL injection characters
                const cleanKey = key.replace(/[$\.]/g, '');
                if (cleanKey !== key) {
                    console.warn(`⚠️  Suspicious key sanitized: ${key} -> ${cleanKey}`);
                }
                sanitized[cleanKey] = this.sanitizeRequestData(data[key]);
            }
            return sanitized;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeRequestData(item));
        }

        return data;
    }

    // Handle authentication failure
    handleAuthFailure() {
        // Clear all stored tokens
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenExpiry');
        localStorage.removeItem('user');

        // Reset service state
        this.csrfToken = null;
        this.csrfEnabled = null;
        this.failureCount = 0;

        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
            console.log('🔄 Redirecting to login due to auth failure');
            window.location.href = '/login';
        }
    }

    // Method to manually refresh CSRF token
    async refreshCSRFToken() {
        return await this.getCSRFToken();
    }

    // Get current CSRF token
    getCurrentCSRFToken() {
        return this.csrfToken;
    }

    // Check if CSRF is enabled
    isCSRFEnabled() {
        return this.csrfEnabled;
    }

    // Get security status
    getSecurityStatus() {
        return {
            csrfEnabled: this.csrfEnabled,
            hasToken: !!this.csrfToken,
            failureCount: this.failureCount,
            autoRefreshActive: !!this.tokenRefreshInterval,
            tokenExpiry: localStorage.getItem('csrfTokenExpiry')
        };
    }

    // Cleanup method
    destroy() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }

        // Clear stored tokens
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenExpiry');

        this.csrfToken = null;
        this.csrfEnabled = null;
    }
}

// Export singleton instance
export const csrfService = new CSRFService();
export default csrfService;
