const sanitizeHtml = require("sanitize-html");

/**
 * XSS Protection Utilities
 * Provides comprehensive input sanitization and validation
 */

/**
 * Default sanitization options for HTML content
 */
const defaultSanitizeOptions = {
    allowedTags: [], // No HTML tags allowed by default
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedIframeHostnames: [],
    allowedIframeDomains: [],
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: false,
    enforceHtmlBoundary: false
};

/**
 * Relaxed sanitization options for content that may need some formatting
 */
const relaxedSanitizeOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedIframeHostnames: [],
    allowedIframeDomains: [],
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: false,
    enforceHtmlBoundary: false
};

/**
 * Sanitize a single string input
 * @param {string} input - The input string to sanitize
 * @param {boolean} allowBasicHtml - Whether to allow basic HTML formatting
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (input, allowBasicHtml = false) => {
    if (typeof input !== 'string') {
        return input;
    }

    const options = allowBasicHtml ? relaxedSanitizeOptions : defaultSanitizeOptions;
    return sanitizeHtml(input.trim(), options);
};

/**
 * Sanitize an object recursively
 * @param {Object} obj - The object to sanitize
 * @param {Array} fieldsToSanitize - Array of field names to sanitize
 * @param {boolean} allowBasicHtml - Whether to allow basic HTML formatting
 * @returns {Object} - Object with sanitized fields
 */
const sanitizeObject = (obj, fieldsToSanitize = [], allowBasicHtml = false) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized = { ...obj };

    fieldsToSanitize.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'string') {
            sanitized[field] = sanitizeInput(sanitized[field], allowBasicHtml);
        }
    });

    return sanitized;
};

/**
 * Express middleware for request body sanitization
 * @param {Array} fieldsToSanitize - Array of field names to sanitize
 * @param {boolean} allowBasicHtml - Whether to allow basic HTML formatting
 */
const sanitizeRequestBody = (fieldsToSanitize = [], allowBasicHtml = false) => {
    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body, fieldsToSanitize, allowBasicHtml);
        }

        // Also sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            Object.keys(req.query).forEach(key => {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = sanitizeInput(req.query[key], false);
                }
            });
        }

        next();
    };
};

/**
 * Validate and sanitize common user input fields
 */
const sanitizeUserInput = (userData) => {
    const commonFields = [
        'firstName', 'lastName', 'email', 'username',
        'address', 'city', 'state', 'country', 'bio',
        'company', 'website', 'phone'
    ];

    return sanitizeObject(userData, commonFields, false);
};

/**
 * Validate and sanitize room/property related fields
 */
const sanitizeRoomInput = (roomData) => {
    const roomFields = [
        'roomDescription', 'address', 'title', 'location',
        'amenities', 'rules', 'notes', 'contactInfo'
    ];

    return sanitizeObject(roomData, roomFields, true); // Allow basic HTML for descriptions
};

/**
 * Validate and sanitize contact form fields
 */
const sanitizeContactInput = (contactData) => {
    const contactFields = [
        'name', 'email', 'subject', 'message', 'phone'
    ];

    return sanitizeObject(contactData, contactFields, false);
};

/**
 * Validate and sanitize payment/order data
 */
const sanitizePaymentInput = (paymentData) => {
    const paymentFields = [
        'currency', 'description', 'customerName', 'customerEmail'
    ];

    // Only sanitize string fields, preserve numeric fields like amount
    return sanitizeObject(paymentData, paymentFields, false);
};

/**
 * Remove potential XSS vectors from file names
 */
const sanitizeFileName = (fileName) => {
    if (typeof fileName !== 'string') {
        return fileName;
    }

    // Remove path traversal attempts and dangerous characters
    return fileName
        .replace(/[<>:"/\\|?*]/g, '') // Remove dangerous characters
        .replace(/\.\./g, '') // Remove path traversal attempts
        .replace(/^\.|\.$/g, '') // Remove leading/trailing dots
        .trim();
};

/**
 * Validate URL inputs to prevent XSS through URLs
 */
const sanitizeUrl = (url) => {
    if (typeof url !== 'string') {
        return url;
    }

    // Basic URL validation - only allow http/https protocols
    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    if (urlPattern.test(url)) {
        return url;
    }

    return ''; // Return empty string for invalid URLs
};

module.exports = {
    sanitizeInput,
    sanitizeObject,
    sanitizeRequestBody,
    sanitizeUserInput,
    sanitizeRoomInput,
    sanitizeContactInput,
    sanitizePaymentInput,
    sanitizeFileName,
    sanitizeUrl,
    defaultSanitizeOptions,
    relaxedSanitizeOptions
};
