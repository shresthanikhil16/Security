import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { csrfService } from '../services/csrfService';

export const useCSRFProtection = () => {
    const [csrfToken, setCSRFToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [secureAxios, setSecureAxios] = useState(null);
    const [csrfEnabled, setCSRFEnabled] = useState(false);

    useEffect(() => {
        const initializeCSRF = async () => {
            try {
                setIsLoading(true);
                const token = await csrfService.getCSRFToken();
                setCSRFToken(token);
                setCSRFEnabled(csrfService.isCSRFEnabled());

                const axiosInstance = await csrfService.createSecureAxiosInstance();
                console.log('Axios instance received:', {
                    instance: !!axiosInstance,
                    type: typeof axiosInstance,
                    hasGet: axiosInstance ? typeof axiosInstance.get : 'N/A',
                    hasPost: axiosInstance ? typeof axiosInstance.post : 'N/A',
                    hasDelete: axiosInstance ? typeof axiosInstance.delete : 'N/A',
                    methods: axiosInstance ? Object.getOwnPropertyNames(axiosInstance) : []
                });

                if (axiosInstance && typeof axiosInstance.get === 'function' && typeof axiosInstance.post === 'function' && typeof axiosInstance.delete === 'function') {
                    console.log('✅ Valid axios instance with all methods');
                    setSecureAxios(axiosInstance);
                } else {
                    console.error('Invalid axios instance returned from CSRF service, creating enhanced fallback');
                    console.log('Instance details:', {
                        exists: !!axiosInstance,
                        hasGet: axiosInstance ? typeof axiosInstance.get : 'N/A',
                        hasPost: axiosInstance ? typeof axiosInstance.post : 'N/A',
                        hasDelete: axiosInstance ? typeof axiosInstance.delete : 'N/A'
                    });

                    // Create a comprehensive axios instance as fallback
                    const fallbackInstance = axios.create({
                        baseURL: 'https://localhost:3000',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000,
                        withCredentials: true
                    });

                    // Add auth interceptor to fallback
                    fallbackInstance.interceptors.request.use((config) => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        if (user.token) {
                            config.headers.Authorization = `Bearer ${user.token}`;
                        }

                        // Try to add CSRF token if available
                        const csrfToken = localStorage.getItem('csrfToken');
                        if (csrfToken) {
                            config.headers['X-CSRF-Token'] = csrfToken;
                            config.headers['x-csrf-token'] = csrfToken;
                        }

                        config.headers['X-Requested-With'] = 'XMLHttpRequest';
                        return config;
                    });

                    // Verify the fallback instance has all methods
                    console.log('Fallback instance verification:', {
                        hasGet: typeof fallbackInstance.get,
                        hasPost: typeof fallbackInstance.post,
                        hasDelete: typeof fallbackInstance.delete
                    });

                    setSecureAxios(fallbackInstance);
                }                // Show appropriate message
                if (csrfService.isCSRFEnabled()) {
                    console.log('Security protection initialized with CSRF');
                } else {
                    console.warn('Running without CSRF protection - ensure backend is configured');
                }
            } catch (error) {
                console.error('Failed to initialize CSRF protection:', error);
                // Don't show error toast for missing CSRF endpoint
                if (error.response?.status !== 404) {
                    toast.error('Failed to initialize security protection');
                }

                // Create a comprehensive axios instance as fallback even on error
                const fallbackInstance = axios.create({
                    baseURL: 'https://localhost:3000',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                    withCredentials: true
                });

                // Add auth interceptor to error fallback
                fallbackInstance.interceptors.request.use((config) => {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (user.token) {
                        config.headers.Authorization = `Bearer ${user.token}`;
                    }

                    // Try to add CSRF token if available
                    const csrfToken = localStorage.getItem('csrfToken');
                    if (csrfToken) {
                        config.headers['X-CSRF-Token'] = csrfToken;
                        config.headers['x-csrf-token'] = csrfToken;
                    }

                    config.headers['X-Requested-With'] = 'XMLHttpRequest';
                    return config;
                });

                console.log('Error fallback instance created:', {
                    hasGet: typeof fallbackInstance.get,
                    hasPost: typeof fallbackInstance.post,
                    hasDelete: typeof fallbackInstance.delete
                });

                setSecureAxios(fallbackInstance);
            } finally {
                setIsLoading(false);
            }
        };

        initializeCSRF();
    }, []); const refreshCSRFToken = async () => {
        try {
            const token = await csrfService.refreshCSRFToken();
            setCSRFToken(token);
            return token;
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
            if (error.response?.status !== 404) {
                toast.error('Failed to refresh security token');
            }
            throw error;
        }
    };

    return {
        csrfToken,
        isLoading,
        secureAxios,
        csrfEnabled,
        refreshCSRFToken,
    };
};
