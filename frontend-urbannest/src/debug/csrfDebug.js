/**
 * CSRF Debug Script
 * Add this to the browser console to diagnose CSRF issues
 */

console.log('=== CSRF Debug Information ===');

// Check if CSRF service exists
import('../services/csrfService.js').then(({ default: csrfService }) => {
    console.log('CSRF Service:', csrfService);

    // Test creating axios instance directly
    csrfService.createSecureAxiosInstance().then(instance => {
        console.log('Direct CSRF Service Test:');
        console.log('- Instance:', !!instance);
        console.log('- Type:', typeof instance);
        console.log('- Constructor:', instance?.constructor?.name);
        console.log('- Methods:', instance ? Object.getOwnPropertyNames(instance) : []);
        console.log('- Prototype methods:', instance ? Object.getOwnPropertyNames(Object.getPrototypeOf(instance)) : []);
        console.log('- Has get:', typeof instance?.get);
        console.log('- Has post:', typeof instance?.post);
        console.log('- Has delete:', typeof instance?.delete);

        // Test the instance
        if (instance) {
            console.log('Testing axios instance...');
            instance.get('/api/health').then(response => {
                console.log('Test GET successful:', response.status);
            }).catch(error => {
                console.log('Test GET failed:', error.message);
            });
        }
    }).catch(error => {
        console.error('CSRF Service failed:', error);
    });

    // Check CSRF token
    csrfService.getCSRFToken().then(token => {
        console.log('CSRF Token:', token ? token.substring(0, 20) + '...' : 'None');
    }).catch(error => {
        console.error('CSRF Token failed:', error);
    });

}).catch(error => {
    console.error('Could not load CSRF service:', error);
});

// Check basic axios
import('axios').then(({ default: axios }) => {
    console.log('Basic Axios Test:');
    const basicInstance = axios.create({
        baseURL: 'https://localhost:3000',
        headers: { 'Content-Type': 'application/json' }
    });

    console.log('- Basic instance type:', typeof basicInstance);
    console.log('- Basic instance methods:', Object.getOwnPropertyNames(basicInstance));
    console.log('- Basic has get:', typeof basicInstance.get);
    console.log('- Basic has post:', typeof basicInstance.post);
    console.log('- Basic has delete:', typeof basicInstance.delete);
}).catch(error => {
    console.error('Could not load axios:', error);
});

export default 'CSRF Debug Script Loaded';
