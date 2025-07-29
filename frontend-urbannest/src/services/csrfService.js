import axios from 'axios';

class CSRFService {
    constructor() {
        this.csrfToken = null;
        this.baseURL = 'https://localhost:3000';
        this.csrfEnabled = null; // null = unknown, true = enabled, false = disabled
    }

    // Get CSRF token from the server
    async getCSRFToken() {
        try {
            const url = `${this.baseURL}/api/csrf-token`;
            console.log('Attempting to fetch CSRF token from:', url);
            const response = await axios.get(url, {
                withCredentials: true, // Important for CSRF cookies
            });
            this.csrfToken = response.data.csrfToken;
            this.csrfEnabled = true;
            console.log('CSRF protection enabled');
            return this.csrfToken;
        } catch (error) {
            console.log('CSRF token request failed:', error.message, 'URL:', `${this.baseURL}/api/csrf-token`);
            if (error.response?.status === 404) {
                console.warn('CSRF endpoint not found. Running without CSRF protection.');
                this.csrfEnabled = false;
                this.csrfToken = null;
                return null;
            }
            console.error('Failed to get CSRF token:', error);
            throw error;
        }
    }

    // Create axios instance with CSRF token
    async createSecureAxiosInstance() {
        try {
            // Try to get CSRF token, but don't fail if not available
            if (this.csrfEnabled === null) {
                await this.getCSRFToken();
            }

            const headers = {
                'Content-Type': 'application/json',
            };

            // Only add CSRF token if CSRF is enabled
            if (this.csrfEnabled && this.csrfToken) {
                headers['X-CSRF-Token'] = this.csrfToken;
            }

            const instance = axios.create({
                baseURL: this.baseURL,
                withCredentials: this.csrfEnabled || false, // Only use withCredentials if CSRF is enabled
                headers,
            });

            // Add request interceptor to refresh token if needed
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

                    return config;
                },
                (error) => Promise.reject(error)
            );

            // Add response interceptor to handle CSRF token refresh
            instance.interceptors.response.use(
                (response) => response,
                async (error) => {
                    // Only handle CSRF errors if CSRF is enabled
                    if (this.csrfEnabled && error.response?.status === 403 && error.response?.data?.code === 'EBADCSRFTOKEN') {
                        // CSRF token invalid, refresh it
                        try {
                            await this.getCSRFToken();
                            // Retry the original request with new token
                            const originalRequest = error.config;
                            if (this.csrfToken) {
                                originalRequest.headers['X-CSRF-Token'] = this.csrfToken;
                            }
                            return instance.request(originalRequest);
                        } catch (refreshError) {
                            console.error('Failed to refresh CSRF token:', refreshError);
                            return Promise.reject(error);
                        }
                    }
                    return Promise.reject(error);
                }
            );

            console.log('Secure axios instance created successfully', { csrfEnabled: this.csrfEnabled });
            return instance;
        } catch (error) {
            console.error('Failed to create secure axios instance:', error);
            // Return a basic axios instance as fallback
            return axios.create({
                baseURL: this.baseURL,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
    }    // Method to manually refresh CSRF token
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
}

// Export singleton instance
export const csrfService = new CSRFService();
export default csrfService;
