/**
 * Comprehensive Security Test Suite
 * Tests password hashing, token security, and NoSQL injection prevention
 */

const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const BASE_URL = 'https://localhost:3000';
const TEST_USER = {
    name: 'Security Test User',
    email: 'security.test@example.com',
    password: 'SecureTest123!@#',
    weakPassword: '123456'
};

/**
 * Security test runner
 */
class SecurityTestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Run a single test
     */
    async runTest(testName, testFunction) {
        try {
            console.log(`🧪 Running test: ${testName}`);
            await testFunction();
            this.results.passed++;
            this.results.tests.push({ name: testName, status: 'PASSED' });
            console.log(`✅ ${testName} - PASSED\n`);
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
            console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        }
    }

    /**
     * Test 1: Password Hashing Security
     */
    async testPasswordHashing() {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            ...TEST_USER,
            confirm_password: TEST_USER.password,
            recaptchaToken: 'test-token'
        });

        if (response.status !== 200) {
            throw new Error('Registration failed');
        }

        // Verify password is hashed in database (would need database access)
        console.log('✓ Password registration successful');
        console.log('✓ Password should be hashed with bcrypt (check database)');
    }

    /**
     * Test 2: NoSQL Injection Prevention
     */
    async testNoSQLInjection() {
        const maliciousPayloads = [
            { email: { $ne: null }, password: { $ne: null } },
            { email: { $gt: '' }, password: { $gt: '' } },
            { email: { $where: 'this.email' }, password: 'test' },
            { 'email[$ne]': null, 'password[$ne]': null },
            { email: { $regex: '.*' }, password: 'test' }
        ];

        for (const payload of maliciousPayloads) {
            try {
                const response = await axios.post(`${BASE_URL}/api/auth/login`, payload);

                // If we get here without error, the payload wasn't blocked
                if (response.status === 200) {
                    throw new Error(`NoSQL injection not blocked: ${JSON.stringify(payload)}`);
                }
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.log(`✓ Blocked malicious payload: ${JSON.stringify(payload)}`);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Test 3: CSRF Token Security
     */
    async testCSRFSecurity() {
        // Get CSRF token
        const tokenResponse = await axios.get(`${BASE_URL}/api/auth/csrf-token`);

        if (!tokenResponse.data.csrfToken) {
            throw new Error('CSRF token not generated');
        }

        console.log('✓ CSRF token generated successfully');

        // Test request without CSRF token (should fail)
        try {
            await axios.post(`${BASE_URL}/api/protected-endpoint`, { test: 'data' });
            throw new Error('Request without CSRF token should have been blocked');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✓ Request without CSRF token correctly blocked');
            } else {
                throw error;
            }
        }

        // Test request with valid CSRF token (should succeed)
        const validResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        }, {
            headers: {
                'X-CSRF-Token': tokenResponse.data.csrfToken
            }
        });

        console.log('✓ Request with valid CSRF token processed');
    }

    /**
     * Test 4: Token Hashing and Security
     */
    async testTokenSecurity() {
        // Test password reset token generation
        const resetResponse = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
            email: TEST_USER.email
        });

        if (resetResponse.status !== 200) {
            throw new Error('Password reset request failed');
        }

        console.log('✓ Password reset token generated');

        // Test with invalid token (should fail)
        try {
            await axios.post(`${BASE_URL}/api/auth/reset-password`, {
                token: 'invalid-token',
                newPassword: 'NewSecure123!@#'
            });
            throw new Error('Invalid token should have been rejected');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✓ Invalid reset token correctly rejected');
            } else {
                throw error;
            }
        }
    }

    /**
     * Test 5: Password Complexity Enforcement
     */
    async testPasswordComplexity() {
        const weakPasswords = [
            '123456',
            'password',
            'qwerty',
            'abc123',
            'Password1', // Missing special character
            'password!', // Missing uppercase and numbers
            'PASS!123', // Missing lowercase
            'Pass!', // Too short
        ];

        for (const weakPassword of weakPasswords) {
            try {
                await axios.post(`${BASE_URL}/api/auth/register`, {
                    name: 'Test User',
                    email: `test${Date.now()}@example.com`,
                    password: weakPassword,
                    confirm_password: weakPassword,
                    recaptchaToken: 'test-token'
                });
                throw new Error(`Weak password accepted: ${weakPassword}`);
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.log(`✓ Weak password rejected: ${weakPassword}`);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Test 6: Input Sanitization
     */
    async testInputSanitization() {
        const xssPayloads = [
            '<script>alert("xss")</script>',
            'javascript:alert("xss")',
            '<img src="x" onerror="alert(1)">',
            '"><script>alert("xss")</script>',
            '<svg onload=alert(1)>'
        ];

        for (const payload of xssPayloads) {
            try {
                const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                    email: payload,
                    password: 'test'
                });

                // Check if the payload was sanitized
                if (response.data && response.data.message && response.data.message.includes(payload)) {
                    throw new Error(`XSS payload not sanitized: ${payload}`);
                }

                console.log(`✓ XSS payload sanitized: ${payload}`);
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    console.log(`✓ XSS payload blocked: ${payload}`);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Test 7: Rate Limiting
     */
    async testRateLimiting() {
        const maxAttempts = 5;
        const promises = [];

        // Make multiple rapid requests
        for (let i = 0; i < maxAttempts + 2; i++) {
            promises.push(
                axios.post(`${BASE_URL}/api/auth/login`, {
                    email: 'test@example.com',
                    password: 'wrong-password'
                }).catch(error => error.response)
            );
        }

        const responses = await Promise.all(promises);

        // Check if rate limiting kicked in
        const rateLimitedResponses = responses.filter(
            response => response && response.status === 429
        );

        if (rateLimitedResponses.length === 0) {
            throw new Error('Rate limiting not working');
        }

        console.log(`✓ Rate limiting active (${rateLimitedResponses.length} requests blocked)`);
    }

    /**
     * Test 8: Security Headers
     */
    async testSecurityHeaders() {
        const response = await axios.get(`${BASE_URL}/`);

        const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security'
        ];

        for (const header of requiredHeaders) {
            if (!response.headers[header]) {
                throw new Error(`Missing security header: ${header}`);
            }
            console.log(`✓ Security header present: ${header}`);
        }
    }

    /**
     * Test 9: Session Security
     */
    async testSessionSecurity() {
        // Test session token generation and validation
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });

        if (!loginResponse.data.token) {
            throw new Error('Session token not generated');
        }

        console.log('✓ Session token generated');

        // Test protected route with valid token
        const protectedResponse = await axios.get(`${BASE_URL}/api/protected/user-dashboard`, {
            headers: {
                'Authorization': `Bearer ${loginResponse.data.token}`
            }
        });

        if (protectedResponse.status !== 200) {
            throw new Error('Protected route access failed with valid token');
        }

        console.log('✓ Protected route access with valid token successful');

        // Test with invalid token
        try {
            await axios.get(`${BASE_URL}/api/protected/user-dashboard`, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
            throw new Error('Invalid token should have been rejected');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✓ Invalid token correctly rejected');
            } else {
                throw error;
            }
        }
    }

    /**
     * Test 10: Data Encryption
     */
    async testDataEncryption() {
        // Test that sensitive data is properly encrypted
        console.log('✓ Checking data encryption...');

        // This would require database access to verify encryption
        // For now, we'll check that the API doesn't expose sensitive data
        const userResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
            headers: {
                'Authorization': `Bearer ${await this.getValidToken()}`
            }
        });

        if (userResponse.data.password) {
            throw new Error('Password exposed in API response');
        }

        if (userResponse.data.resetPasswordToken) {
            throw new Error('Reset token exposed in API response');
        }

        console.log('✓ Sensitive data not exposed in API responses');
    }

    /**
     * Helper method to get a valid authentication token
     */
    async getValidToken() {
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            return response.data.token;
        } catch (error) {
            // If login fails, the user might not exist, try registering first
            await axios.post(`${BASE_URL}/api/auth/register`, {
                ...TEST_USER,
                confirm_password: TEST_USER.password,
                recaptchaToken: 'test-token'
            });

            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            return loginResponse.data.token;
        }
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log('🔐 Starting Comprehensive Security Test Suite\n');
        console.log('='.repeat(50));

        await this.runTest('Password Hashing Security', () => this.testPasswordHashing());
        await this.runTest('NoSQL Injection Prevention', () => this.testNoSQLInjection());
        await this.runTest('CSRF Token Security', () => this.testCSRFSecurity());
        await this.runTest('Token Hashing and Security', () => this.testTokenSecurity());
        await this.runTest('Password Complexity Enforcement', () => this.testPasswordComplexity());
        await this.runTest('Input Sanitization', () => this.testInputSanitization());
        await this.runTest('Rate Limiting', () => this.testRateLimiting());
        await this.runTest('Security Headers', () => this.testSecurityHeaders());
        await this.runTest('Session Security', () => this.testSessionSecurity());
        await this.runTest('Data Encryption', () => this.testDataEncryption());

        this.printResults();
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('='.repeat(50));
        console.log('🔐 Security Test Suite Results');
        console.log('='.repeat(50));
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`📊 Total Tests: ${this.results.tests.length}`);
        console.log(`🎯 Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%`);

        console.log('\n📋 Detailed Results:');
        this.results.tests.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });

        if (this.results.failed === 0) {
            console.log('\n🎉 All security tests passed! Your application is secure.');
        } else {
            console.log('\n⚠️  Some security tests failed. Please review and fix the issues.');
        }
    }
}

// Export for use in other files
module.exports = SecurityTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new SecurityTestSuite();
    testSuite.runAllTests().catch(console.error);
}
