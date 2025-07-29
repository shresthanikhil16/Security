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
                if (axiosInstance && typeof axiosInstance.get === 'function') {
                    setSecureAxios(axiosInstance);
                } else {
                    console.error('Invalid axios instance returned from CSRF service');
                    // Create a basic axios instance as fallback
                    const fallbackInstance = axios.create({
                        baseURL: 'https://localhost:3000',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    setSecureAxios(fallbackInstance);
                }

                // Show appropriate message
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

                // Create a basic axios instance as fallback even on error
                const fallbackInstance = axios.create({
                    baseURL: 'https://localhost:3000',
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
