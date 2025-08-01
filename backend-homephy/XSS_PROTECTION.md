# XSS Protection Implementation

This document outlines the comprehensive XSS (Cross-Site Scripting) protection measures implemented in the UrbanNest backend application using Helmet and additional security utilities.

## Overview

XSS protection has been implemented at multiple levels:
1. **HTTP Headers** - Using Helmet middleware
2. **Input Sanitization** - Custom utilities for request data
3. **Content Security Policy** - Restricting resource loading
4. **Output Encoding** - Safe rendering of dynamic content

## 1. Helmet Configuration

Located in: `middleware/security.js`

### Security Headers Implemented:

- **Content Security Policy (CSP)**: Prevents execution of malicious scripts
- **X-XSS-Protection**: Legacy XSS filter for older browsers
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **Strict Transport Security (HSTS)**: Enforces HTTPS connections
- **X-DNS-Prefetch-Control**: Controls DNS prefetching
- **Referrer Policy**: Controls referrer information

### Usage:
```javascript
const { securityMiddleware, xssProtection } = require('./middleware/security');
app.use(securityMiddleware);
app.use(xssProtection);
```

## 2. Input Sanitization

Located in: `utils/xssProtection.js`

### Available Functions:

#### `sanitizeInput(input, allowBasicHtml)`
- Sanitizes individual string inputs
- Option to allow basic HTML formatting (b, i, em, strong, p, br)

#### `sanitizeObject(obj, fieldsToSanitize, allowBasicHtml)`
- Sanitizes specific fields in an object
- Recursive sanitization support

#### `sanitizeRequestBody(fieldsToSanitize, allowBasicHtml)`
- Express middleware for automatic request sanitization
- Also sanitizes query parameters

#### Specialized Sanitizers:
- `sanitizeUserInput(userData)` - For user registration/profile data
- `sanitizeRoomInput(roomData)` - For property/room listings
- `sanitizeContactInput(contactData)` - For contact forms
- `sanitizeFileName(fileName)` - For uploaded file names
- `sanitizeUrl(url)` - For URL validation

### Usage Examples:

```javascript
// In auth controller
const { sanitizeUserInput } = require('../utils/xssProtection');
const sanitizedData = sanitizeUserInput(req.body);

// In room controller  
const { sanitizeRoomInput } = require('../utils/xssProtection');
const sanitizedData = sanitizeRoomInput(req.body);

// In contact controller
const { sanitizeContactInput } = require('../utils/xssProtection');
const sanitizedData = sanitizeContactInput(req.body);
```

## 3. Content Security Policy (CSP)

### Current CSP Directives:

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https:"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    connectSrc: ["'self'", "https:", "http:"],
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
}
```

### Customization:
- Modify `middleware/security.js` to adjust CSP rules
- Consider tightening `scriptSrc` and `styleSrc` for production
- Remove `'unsafe-inline'` and `'unsafe-eval'` when possible

## 4. File Upload Security

### Implemented Measures:
- File type validation (MIME type + extension)
- File name sanitization
- File size limits (configure in multer middleware)
- Safe file storage location

### Usage:
```javascript
const { sanitizeFileName } = require('../utils/xssProtection');
const sanitizedFileName = sanitizeFileName(req.file.originalname);
```

## 5. Updated Controllers

The following controllers have been updated with XSS protection:

### Auth Controller (`controllers/authController.js`)
- Registration and login input sanitization
- Email field validation
- Password handling (no sanitization to preserve special characters)

### Room Controller (`controllers/roomController.js`)
- Room description and address sanitization
- Allows basic HTML formatting for descriptions
- File upload name sanitization

### Contact Controller (`controllers/contactController.js`)
- Contact form field sanitization
- Email content protection

## 6. Best Practices Implemented

1. **Input Validation**: All user inputs are validated and sanitized
2. **Output Encoding**: Using sanitize-html for safe output
3. **Whitelist Approach**: Only allowing specific HTML tags when needed
4. **Context-Aware Sanitization**: Different rules for different data types
5. **File Security**: Secure file upload handling
6. **Error Handling**: Graceful handling of sanitization errors

## 7. Configuration Options

### Sanitization Levels:

#### Strict (Default):
- No HTML tags allowed
- Complete XSS protection
- Used for: user data, contact forms, sensitive fields

#### Relaxed:
- Basic formatting tags allowed (b, i, em, strong, p, br)
- Used for: descriptions, content that may need formatting

### Customizing Sanitization:

Modify `utils/xssProtection.js`:

```javascript
const customSanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'em'],
  allowedAttributes: {},
  // ... other options
};
```

## 8. Testing XSS Protection

### Test Inputs:
- `<script>alert('XSS')</script>`
- `javascript:alert('XSS')`
- `<img src=x onerror=alert('XSS')>`
- `<svg onload=alert('XSS')>`

### Expected Behavior:
- All script tags should be removed
- JavaScript URLs should be neutralized
- Event handlers should be stripped
- Content should be safely escaped

## 9. Monitoring and Logging

- Check application logs for sanitization activities
- Monitor CSP violation reports (if configured)
- Regular security audits of input handling

## 10. Future Enhancements

1. **CSP Reporting**: Implement CSP violation reporting
2. **Input Validation**: Add more specific validation rules
3. **Rate Limiting**: Implement request rate limiting
4. **Security Headers**: Add additional security headers
5. **Content Filtering**: Implement content-based filtering

## Dependencies

- `helmet`: ^7.1.0 - Main security middleware
- `sanitize-html`: ^2.17.0 - HTML sanitization (already installed)

## Installation

The XSS protection is automatically applied when the server starts. No additional configuration is required for basic protection.

For custom sanitization rules, modify the configuration files in:
- `middleware/security.js` - For HTTP headers and CSP
- `utils/xssProtection.js` - For input sanitization rules
