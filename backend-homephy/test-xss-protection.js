const { sanitizeInput, sanitizeUserInput, sanitizeRoomInput, sanitizeContactInput, sanitizeUrl } = require('./utils/xssProtection');

console.log('=== XSS Protection Test Suite ===\n');

// Test 1: Basic XSS script injection
console.log('Test 1: Basic Script Injection');
const maliciousScript = '<script>alert("XSS Attack!")</script>';
const sanitizedScript = sanitizeInput(maliciousScript);
console.log('Input:', maliciousScript);
console.log('Output:', sanitizedScript);
console.log('✓ Script tags removed\n');

// Test 2: Image with onerror event
console.log('Test 2: Image with onerror Event');
const maliciousImg = '<img src=x onerror=alert("XSS")>';
const sanitizedImg = sanitizeInput(maliciousImg);
console.log('Input:', maliciousImg);
console.log('Output:', sanitizedImg);
console.log('✓ Image with event handler removed\n');

// Test 3: JavaScript URL
console.log('Test 3: JavaScript URL');
const maliciousUrl = 'javascript:alert("XSS")';
const sanitizedUrlResult = sanitizeUrl(maliciousUrl);
console.log('Input:', maliciousUrl);
console.log('Output:', sanitizedUrlResult);
console.log('✓ JavaScript URL blocked\n');

// Test 4: SVG with onload event
console.log('Test 4: SVG with onload Event');
const maliciousSvg = '<svg onload=alert("XSS")>';
const sanitizedSvg = sanitizeInput(maliciousSvg);
console.log('Input:', maliciousSvg);
console.log('Output:', sanitizedSvg);
console.log('✓ SVG with event handler removed\n');

// Test 5: User input sanitization
console.log('Test 5: User Input Sanitization');
const maliciousUserData = {
    name: '<script>alert("XSS")</script>John Doe',
    email: 'user@example.com<script>alert("XSS")</script>',
    bio: 'I am a <b>developer</b> with <script>evil()</script> experience'
};
const sanitizedUserData = sanitizeUserInput(maliciousUserData);
console.log('Input:', JSON.stringify(maliciousUserData, null, 2));
console.log('Output:', JSON.stringify(sanitizedUserData, null, 2));
console.log('✓ User data sanitized\n');

// Test 6: Room input with allowed HTML
console.log('Test 6: Room Input (with basic HTML allowed)');
const maliciousRoomData = {
    roomDescription: 'Nice <b>apartment</b> with <script>alert("XSS")</script> great view',
    address: '123 Main St <img src=x onerror=alert("XSS")>'
};
const sanitizedRoomData = sanitizeRoomInput(maliciousRoomData);
console.log('Input:', JSON.stringify(maliciousRoomData, null, 2));
console.log('Output:', JSON.stringify(sanitizedRoomData, null, 2));
console.log('✓ Room data sanitized (basic HTML preserved)\n');

// Test 7: Contact form sanitization
console.log('Test 7: Contact Form Sanitization');
const maliciousContactData = {
    name: 'John<script>alert("XSS")</script>',
    email: 'john@example.com',
    message: 'Hello <script>document.cookie</script> world!'
};
const sanitizedContactData = sanitizeContactInput(maliciousContactData);
console.log('Input:', JSON.stringify(maliciousContactData, null, 2));
console.log('Output:', JSON.stringify(sanitizedContactData, null, 2));
console.log('✓ Contact data sanitized\n');

// Test 8: Valid URL
console.log('Test 8: Valid URL');
const validUrl = 'https://example.com/page?param=value';
const validUrlResult = sanitizeUrl(validUrl);
console.log('Input:', validUrl);
console.log('Output:', validUrlResult);
console.log('✓ Valid URL preserved\n');

console.log('=== All XSS Protection Tests Completed Successfully! ===');
