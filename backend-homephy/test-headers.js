const https = require('https');

// Create a test request to check security headers
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    rejectUnauthorized: false // For self-signed certificates
};

console.log('=== Testing Security Headers ===\n');

const req = https.request(options, (res) => {
    console.log('Response Status:', res.statusCode);
    console.log('\nSecurity Headers:');
    console.log('================');

    // Check for important security headers
    const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy',
        'x-dns-prefetch-control'
    ];

    securityHeaders.forEach(header => {
        const value = res.headers[header];
        if (value) {
            console.log(`✓ ${header}: ${value}`);
        } else {
            console.log(`✗ ${header}: Not present`);
        }
    });

    console.log('\nAll Response Headers:');
    console.log('====================');
    Object.keys(res.headers).forEach(header => {
        console.log(`${header}: ${res.headers[header]}`);
    });

    console.log('\n=== Security Headers Test Completed ===');
});

req.on('error', (e) => {
    console.error('Request failed:', e.message);
    console.log('Make sure the server is running on https://localhost:3000');
});

req.end();
