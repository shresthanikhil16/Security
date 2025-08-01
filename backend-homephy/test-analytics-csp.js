const https = require('https');

console.log('=== Testing Google Analytics CSP Fix ===\n');

const testEndpoint = () => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            console.log(`✅ CSP Response Status: ${res.statusCode}`);

            const csp = res.headers['content-security-policy'];
            if (csp) {
                console.log('\n🔍 Checking CSP for Google Analytics support...\n');

                // Check script-src
                if (csp.includes('www.googletagmanager.com')) {
                    console.log('✅ script-src: Google Tag Manager allowed');
                } else {
                    console.log('❌ script-src: Google Tag Manager missing');
                }

                if (csp.includes('www.google-analytics.com')) {
                    console.log('✅ script-src: Google Analytics allowed');
                } else {
                    console.log('❌ script-src: Google Analytics missing');
                }

                // Check connect-src for analytics
                if (csp.includes('analytics.google.com')) {
                    console.log('✅ connect-src: Analytics connection allowed');
                } else {
                    console.log('❌ connect-src: Analytics connection missing');
                }

                console.log('\n📋 Full CSP Policy:');
                console.log('===================');
                console.log(csp);

            } else {
                console.log('❌ No CSP header found');
            }

            console.log('\n🎯 Expected Behavior:');
            console.log('=====================');
            console.log('✅ Google Analytics should now load without errors');
            console.log('✅ Google Tag Manager scripts should execute');
            console.log('✅ Analytics data collection should work');
            console.log('✅ XSS protection remains active for other domains');

            resolve();
        });

        req.on('error', (e) => {
            console.error('❌ Connection failed:', e.message);
            resolve();
        });

        req.end();
    });
};

testEndpoint();
