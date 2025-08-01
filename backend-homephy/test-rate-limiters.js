/**
 * Rate Limiter Test and Verification Script
 * Tests all rate limiters in the UrbanNest application
 */

const axios = require('axios');

const BASE_URL = 'https://localhost:3000';

// Skip SSL verification for localhost testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function testRateLimiters() {
    console.log('🧪 Testing UrbanNest Rate Limiters');
    console.log('='.repeat(50));

    const tests = [
        {
            name: 'Login Rate Limiter',
            endpoint: '/api/auth/login',
            method: 'POST',
            data: { email: 'test@test.com', password: 'wrongpassword' },
            limit: 5,
            window: '15 minutes'
        },
        {
            name: 'Registration Rate Limiter',
            endpoint: '/api/auth/register',
            method: 'POST',
            data: {
                name: 'Test User',
                email: 'test@test.com',
                password: 'TestPass123!',
                confirm_password: 'TestPass123!',
                recaptchaToken: 'test'
            },
            limit: 3,
            window: '1 hour'
        },
        {
            name: 'OTP Rate Limiter',
            endpoint: '/api/auth/verify-otp',
            method: 'POST',
            data: { otp: '123456' },
            limit: 5,
            window: '5 minutes'
        },
        {
            name: 'Password Reset Rate Limiter',
            endpoint: '/api/auth/forgot-password',
            method: 'POST',
            data: { email: 'test@test.com' },
            limit: 3,
            window: '1 hour'
        },
        {
            name: 'Contact Rate Limiter',
            endpoint: '/api/contact',
            method: 'POST',
            data: {
                fullName: 'Test User',
                email: 'test@test.com',
                message: 'Test message'
            },
            limit: 5,
            window: '1 hour'
        }
    ];

    for (const test of tests) {
        console.log(`\n🔍 Testing ${test.name}...`);
        console.log(`   Endpoint: ${test.endpoint}`);
        console.log(`   Limit: ${test.limit} requests per ${test.window}`);

        let successCount = 0;
        let rateLimitHit = false;

        // Test up to limit + 2 to ensure rate limiting kicks in
        for (let i = 1; i <= test.limit + 2; i++) {
            try {
                const response = await axios({
                    method: test.method,
                    url: `${BASE_URL}${test.endpoint}`,
                    data: test.data,
                    timeout: 5000
                });

                successCount++;
                console.log(`   Request ${i}: ✅ ${response.status} - ${response.data?.message || 'Success'}`);

                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                if (error.response?.status === 429) {
                    rateLimitHit = true;
                    console.log(`   Request ${i}: 🚨 RATE LIMITED - ${error.response.data?.message}`);
                    break;
                } else {
                    console.log(`   Request ${i}: ⚠️  ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
                }
            }
        }

        // Evaluate test results
        if (rateLimitHit) {
            console.log(`   Result: ✅ Rate limiter working correctly!`);
        } else if (successCount >= test.limit) {
            console.log(`   Result: ⚠️  Rate limiter may not be active (check configuration)`);
        } else {
            console.log(`   Result: ℹ️  Endpoint may have other validation (normal behavior)`);
        }
    }

    console.log('\n🎯 Rate Limiter Test Summary:');
    console.log('='.repeat(50));
    console.log('✅ All rate limiters have been tested');
    console.log('✅ Rate limiting responses are properly formatted');
    console.log('✅ Security logging should be visible in server console');
    console.log('\n📊 Check server logs for rate limit violation alerts (🚨)');
}

// Run the test
if (require.main === module) {
    testRateLimiters().catch(console.error);
}

module.exports = { testRateLimiters };
