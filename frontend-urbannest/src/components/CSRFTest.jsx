/**
 * CSRF Protection Test Component
 * Use this to debug CSRF token generation and secure axios functionality
 */

import axios from 'axios';
import { useState } from 'react';
import { useCSRFProtection } from '../hooks/useCSRFProtection';

const CSRFTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const { secureAxios, isLoading: csrfLoading } = useCSRFProtection();

    const addResult = (test, status, message, data = null) => {
        setTestResults(prev => [...prev, {
            test,
            status,
            message,
            data,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const runTests = async () => {
        setIsRunning(true);
        setTestResults([]);

        // Test 1: CSRF Token Generation
        addResult("CSRF Token Generation", "info", "Testing CSRF token endpoint...");
        try {
            const response = await axios.get('https://localhost:3000/api/auth/csrf-token', {
                withCredentials: true,
                timeout: 10000
            });

            if (response.data.success && response.data.csrfToken) {
                addResult("CSRF Token Generation", "success", "CSRF token generated successfully", {
                    token: response.data.csrfToken.substring(0, 20) + "...",
                    expiresAt: response.data.expiresAt
                });
            } else {
                addResult("CSRF Token Generation", "error", "Invalid CSRF token response", response.data);
            }
        } catch (error) {
            addResult("CSRF Token Generation", "error", `CSRF token generation failed: ${error.message}`, {
                status: error.response?.status,
                statusText: error.response?.statusText
            });
        }

        // Test 2: Secure Axios Availability
        addResult("Secure Axios", "info", "Checking secure axios availability...");
        if (secureAxios && typeof secureAxios.get === 'function') {
            addResult("Secure Axios", "success", "Secure axios instance is available");

            // Test 3: Secure API Call
            addResult("Secure API Call", "info", "Testing secure API call...");
            try {
                const response = await secureAxios.get('/api/health');
                addResult("Secure API Call", "success", "Secure API call successful", response.data);
            } catch (error) {
                addResult("Secure API Call", "error", `Secure API call failed: ${error.message}`, {
                    status: error.response?.status,
                    statusText: error.response?.statusText
                });
            }
        } else {
            addResult("Secure Axios", "error", `Secure axios not available. Loading: ${csrfLoading}`);
        }

        // Test 4: Delete Endpoint Test (without actually deleting)
        addResult("Delete Endpoint", "info", "Testing DELETE endpoint access...");
        try {
            // Try to access a fake delete endpoint to test CSRF protection
            if (secureAxios && typeof secureAxios.delete === 'function') {
                try {
                    await secureAxios.delete('/api/user/delete/test-id-123');
                } catch (error) {
                    if (error.response?.status === 404) {
                        addResult("Delete Endpoint", "success", "CSRF protection working (404 expected for test ID)");
                    } else if (error.response?.status === 403) {
                        addResult("Delete Endpoint", "warning", "403 Forbidden - possible auth issue", {
                            status: error.response.status,
                            message: error.response.data?.message
                        });
                    } else {
                        addResult("Delete Endpoint", "info", `Unexpected response: ${error.response?.status}`, error.response?.data);
                    }
                }
            } else {
                addResult("Delete Endpoint", "error", "Secure axios not available for testing");
            }
        } catch (error) {
            addResult("Delete Endpoint", "error", `Delete endpoint test failed: ${error.message}`);
        }

        // Test 5: Backend Connectivity
        addResult("Backend Status", "info", "Checking backend connectivity...");
        try {
            const response = await axios.get('https://localhost:3000/api/health', { timeout: 5000 });
            addResult("Backend Status", "success", "Backend is reachable", response.data);
        } catch (error) {
            addResult("Backend Status", "error", `Backend not reachable: ${error.message}`, {
                status: error.response?.status,
                code: error.code
            });
        }

        setIsRunning(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            default: return 'text-blue-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return '📋';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🔐 CSRF Protection Diagnostic</h2>

            <div className="mb-6">
                <button
                    onClick={runTests}
                    disabled={isRunning}
                    className={`px-6 py-3 rounded-lg font-medium ${isRunning
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isRunning ? 'Running Tests...' : 'Run Security Tests'}
                </button>
            </div>

            <div className="space-y-4">
                {testResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800">
                                {getStatusIcon(result.status)} {result.test}
                            </h3>
                            <span className="text-sm text-gray-500">{result.timestamp}</span>
                        </div>
                        <p className={`mb-2 ${getStatusColor(result.status)}`}>
                            {result.message}
                        </p>
                        {result.data && (
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">📋 Debugging Instructions</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>1. Run the tests above to check CSRF token generation</li>
                    <li>2. Verify backend is running on port 3000</li>
                    <li>3. Check browser console for detailed error messages</li>
                    <li>4. Ensure CORS is properly configured on the backend</li>
                    <li>5. Verify user authentication token is valid</li>
                </ul>
            </div>
        </div>
    );
};

export default CSRFTest;
