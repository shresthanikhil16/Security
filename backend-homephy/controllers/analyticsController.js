const { sanitizeInput } = require("../utils/xssProtection");

/**
 * Custom Analytics Controller
 * Handles analytics data when Google Analytics is blocked
 */

/**
 * Track analytics events
 */
exports.trackEvent = async (req, res) => {
    try {
        // Sanitize input data to prevent XSS
        const sanitizedBody = {
            timestamp: sanitizeInput(req.body.timestamp || ''),
            eventName: sanitizeInput(req.body.eventName || ''),
            parameters: req.body.parameters || {},
            userAgent: sanitizeInput(req.body.userAgent || ''),
            url: sanitizeInput(req.body.url || ''),
            referrer: sanitizeInput(req.body.referrer || '')
        };

        // Sanitize parameters object
        if (sanitizedBody.parameters && typeof sanitizedBody.parameters === 'object') {
            for (const key in sanitizedBody.parameters) {
                if (typeof sanitizedBody.parameters[key] === 'string') {
                    sanitizedBody.parameters[key] = sanitizeInput(sanitizedBody.parameters[key]);
                }
            }
        }

        console.log('Analytics Event Tracked:', {
            event: sanitizedBody.eventName,
            timestamp: sanitizedBody.timestamp,
            url: sanitizedBody.url,
            parameters: sanitizedBody.parameters
        });

        // Here you could store this data in your database if needed
        // For now, we'll just log it and acknowledge receipt

        // Optional: Store in database for your own analytics
        // const AnalyticsEvent = require("../models/analyticsModel");
        // await AnalyticsEvent.create(sanitizedBody);

        res.status(200).json({
            success: true,
            message: "Event tracked successfully",
            event: sanitizedBody.eventName
        });

    } catch (error) {
        console.error("Error tracking analytics event:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track event",
            error: error.message
        });
    }
};

/**
 * Get analytics summary (for admin dashboard)
 */
exports.getAnalyticsSummary = async (req, res) => {
    try {
        // This would typically fetch from your analytics database
        // For now, return a simple response

        res.status(200).json({
            success: true,
            message: "Analytics summary",
            data: {
                totalEvents: 0,
                recentEvents: [],
                note: "Custom analytics tracking active - resilient to ad blockers"
            }
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
            error: error.message
        });
    }
};
