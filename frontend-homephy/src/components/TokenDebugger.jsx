import { useState } from 'react';
import { useCSRFProtection } from '../hooks/useCSRFProtection';

const TokenDebugger = () => {
    const [debugInfo, setDebugInfo] = useState(null);
    const { secureAxios, csrfToken, isLoading } = useCSRFProtection();

    const checkTokens = async () => {
        const info = {
            timestamp: new Date().toLocaleTimeString(),
            csrfLoading: isLoading,
            csrfToken: csrfToken ? csrfToken.substring(0, 20) + "..." : "Not available",
            secureAxiosAvailable: !!secureAxios,
            secureAxiosType: typeof secureAxios,
            secureAxiosMethods: secureAxios ? Object.getOwnPropertyNames(secureAxios).join(', ') : "None",
            secureAxiosPrototype: secureAxios ? Object.getOwnPropertyNames(Object.getPrototypeOf(secureAxios)).join(', ') : "None",
            hasDeleteMethod: secureAxios ? typeof secureAxios.delete : "N/A",
            hasRequestMethod: secureAxios ? typeof secureAxios.request : "N/A",
            hasGetMethod: secureAxios ? typeof secureAxios.get : "N/A",
            localStorageToken: localStorage.getItem('user') ? "Available" : "Missing",
            csrfTokenInStorage: localStorage.getItem('csrfToken') ? "Available" : "Missing",
            csrfTokenExpiry: localStorage.getItem('csrfTokenExpiry') || "No expiry set"
        };

        // Test CSRF endpoint
        try {
            const response = await fetch('https://localhost:3000/api/auth/csrf-token', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            info.csrfEndpointStatus = response.status;
            if (response.ok) {
                const data = await response.json();
                info.freshToken = data.csrfToken ? data.csrfToken.substring(0, 20) + "..." : "Invalid format";
                info.csrfResponseData = JSON.stringify(data, null, 2);
            } else {
                const errorData = await response.json();
                info.csrfEndpointError = JSON.stringify(errorData, null, 2);
            }
        } catch (error) {
            info.csrfEndpointError = error.message;
        }

        setDebugInfo(info);
    };

    return (
        <div className="bg-gray-100 p-4 rounded-lg max-w-md">
            <h3 className="font-bold mb-2">Token Debugger</h3>
            <button
                onClick={checkTokens}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
                Check Token Status
            </button>

            {debugInfo && (
                <div className="text-sm space-y-1">
                    <div><strong>Time:</strong> {debugInfo.timestamp}</div>
                    <div><strong>CSRF Loading:</strong> {debugInfo.csrfLoading ? "Yes" : "No"}</div>
                    <div><strong>CSRF Token:</strong> {debugInfo.csrfToken}</div>
                    <div><strong>Secure Axios:</strong> {debugInfo.secureAxiosAvailable ? "Available" : "Missing"}</div>
                    <div><strong>Axios Type:</strong> {debugInfo.secureAxiosType}</div>
                    <div><strong>Axios Methods:</strong> {debugInfo.secureAxiosMethods}</div>
                    <div><strong>Axios Prototype:</strong> {debugInfo.secureAxiosPrototype}</div>
                    <div><strong>Delete Method:</strong> {debugInfo.hasDeleteMethod}</div>
                    <div><strong>Request Method:</strong> {debugInfo.hasRequestMethod}</div>
                    <div><strong>Get Method:</strong> {debugInfo.hasGetMethod}</div>
                    <div><strong>Auth Token:</strong> {debugInfo.localStorageToken}</div>
                    <div><strong>CSRF in Storage:</strong> {debugInfo.csrfTokenInStorage}</div>
                    <div><strong>Token Expiry:</strong> {debugInfo.csrfTokenExpiry}</div>
                    <div><strong>Endpoint Status:</strong> {debugInfo.csrfEndpointStatus || debugInfo.csrfEndpointError}</div>
                    {debugInfo.freshToken && <div><strong>Fresh Token:</strong> {debugInfo.freshToken}</div>}
                </div>
            )}
        </div>
    );
};

export default TokenDebugger;
