#!/usr/bin/env node

/**
 * Quick Backend Health Check Script
 * Tests if backend is running and configured properly for CSRF
 */

const https = require('https');
const process = require('process');

// Disable SSL verification for localhost testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const baseUrl = 'https://localhost:3000';

const testEndpoints = [
    {
        name: 'Backend Health Check',
        path: '/api/health',
        method: 'GET',
        expected: 'Backend response'
    },
    {
        name: 'CSRF Token Generation',
        path: '/api/auth/csrf-token',
        method: 'GET',
        expected: 'CSRF token'
    },
    {
        name: 'Rooms API',
        path: '/api/rooms',
        method: 'GET',
        expected: 'Room data'
    }
];

function makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${baseUrl}${endpoint.path}`;
        const options = {
            method: endpoint.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };

        const req = https.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runHealthCheck() {
    console.log('🔍 Starting Backend Health Check...\n');
    console.log(`Testing backend at: ${baseUrl}\n`);

    let allPassed = true;

    for (const endpoint of testEndpoints) {
        console.log(`📋 Testing: ${endpoint.name}`);
        console.log(`   Endpoint: ${endpoint.method} ${endpoint.path}`);

        try {
            const response = await makeRequest(endpoint);

            if (response.status >= 200 && response.status < 300) {
                console.log(`   ✅ SUCCESS (${response.status})`);

                if (endpoint.path === '/api/auth/csrf-token') {
                    if (response.data.success && response.data.csrfToken) {
                        console.log(`   🔑 CSRF Token: ${response.data.csrfToken.substring(0, 20)}...`);
                        console.log(`   ⏰ Expires: ${response.data.expiresAt || 'No expiry'}`);
                    } else {
                        console.log(`   ⚠️  Invalid CSRF response format`);
                        allPassed = false;
                    }
                }

                if (endpoint.path === '/api/health') {
                    console.log(`   💚 Backend is healthy`);
                }

                if (endpoint.path === '/api/rooms') {
                    const rooms = response.data.rooms || response.data || [];
                    console.log(`   🏠 Found ${Array.isArray(rooms) ? rooms.length : 'unknown'} rooms`);
                }

            } else if (response.status === 404) {
                console.log(`   ❌ NOT FOUND (${response.status}) - Endpoint not implemented`);
                allPassed = false;
            } else if (response.status === 403) {
                console.log(`   🚫 FORBIDDEN (${response.status}) - CSRF protection may be blocking`);
                allPassed = false;
            } else {
                console.log(`   ⚠️  UNEXPECTED (${response.status}): ${response.statusMessage}`);
                allPassed = false;
            }

        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}`);

            if (error.code === 'ECONNREFUSED') {
                console.log(`   💡 Backend not running on port 3000`);
            } else if (error.code === 'ENOTFOUND') {
                console.log(`   💡 DNS resolution failed`);
            } else if (error.message === 'Request timeout') {
                console.log(`   💡 Backend not responding (timeout)`);
            }

            allPassed = false;
        }

        console.log('');
    }

    console.log('📊 SUMMARY:');
    if (allPassed) {
        console.log('✅ All backend checks passed!');
        console.log('🎉 Backend is properly configured for CSRF protection');
    } else {
        console.log('❌ Some backend checks failed');
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Ensure backend is running: npm start (in backend directory)');
        console.log('2. Check backend logs for errors');
        console.log('3. Verify CORS configuration allows frontend origin');
        console.log('4. Ensure CSRF middleware is properly configured');
        console.log('5. Check if SSL certificate is properly set up');
        console.log('\n📚 See BACKEND_SECURITY_DEPLOYMENT.md for setup instructions');
    }
}

// Run the health check
runHealthCheck().catch(console.error);
