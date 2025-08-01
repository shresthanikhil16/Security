// Quick test script to debug axios instance creation
import axios from 'axios';

console.log('Testing axios instance creation...');

// Test 1: Basic axios create
const basicInstance = axios.create({
    baseURL: 'https://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log('Basic instance methods:', Object.getOwnPropertyNames(basicInstance));
console.log('Basic instance get method:', typeof basicInstance.get);
console.log('Basic instance post method:', typeof basicInstance.post);
console.log('Basic instance delete method:', typeof basicInstance.delete);

// Test 2: Instance with interceptors
const interceptorInstance = axios.create({
    baseURL: 'https://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptors like in CSRF service
interceptorInstance.interceptors.request.use(
    (config) => {
        console.log('Request interceptor called');
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

interceptorInstance.interceptors.response.use(
    (response) => {
        console.log('Response interceptor called');
        return response;
    },
    (error) => {
        console.error('Response interceptor error:', error);
        return Promise.reject(error);
    }
);

console.log('Interceptor instance methods:', Object.getOwnPropertyNames(interceptorInstance));
console.log('Interceptor instance get method:', typeof interceptorInstance.get);
console.log('Interceptor instance post method:', typeof interceptorInstance.post);
console.log('Interceptor instance delete method:', typeof interceptorInstance.delete);

export { basicInstance, interceptorInstance };
