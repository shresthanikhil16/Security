const express = require('express');
const { sendContactForm } = require('../controllers/contactController');
const { contactRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiter to contact form submissions
router.post('/', contactRateLimiter, sendContactForm);

module.exports = router;
