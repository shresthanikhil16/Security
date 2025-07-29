/**
 * Analytics Helper - Resilient to Ad Blockers
 * This provides analytics functionality even when Google Analytics is blocked
 */

class AnalyticsHelper {
    constructor() {
        this.isGoogleAnalyticsBlocked = false;
        this.fallbackAnalytics = [];
        this.checkGoogleAnalytics();
    }

    /**
     * Check if Google Analytics is available or blocked
     */
    checkGoogleAnalytics() {
        // Try to detect if Google Analytics is blocked
        if (typeof gtag === 'undefined' && typeof ga === 'undefined') {
            this.isGoogleAnalyticsBlocked = true;
            console.log('Google Analytics appears to be blocked by ad blocker');
        }
    }

    /**
     * Track events with fallback for blocked analytics
     */
    trackEvent(eventName, parameters = {}) {
        try {
            // Try Google Analytics first
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, parameters);
                console.log('Event tracked via Google Analytics:', eventName, parameters);
                return;
            }

            // Fallback to local tracking
            this.trackEventLocally(eventName, parameters);
        } catch (error) {
            console.log('Analytics tracking failed, using fallback:', error);
            this.trackEventLocally(eventName, parameters);
        }
    }

    /**
     * Local fallback analytics tracking
     */
    trackEventLocally(eventName, parameters = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            eventName: eventName,
            parameters: parameters,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };

        // Store in local storage for later transmission
        this.fallbackAnalytics.push(event);

        // Keep only last 100 events to prevent storage bloat
        if (this.fallbackAnalytics.length > 100) {
            this.fallbackAnalytics = this.fallbackAnalytics.slice(-100);
        }

        // Store in localStorage
        try {
            localStorage.setItem('urbannest_analytics', JSON.stringify(this.fallbackAnalytics));
        } catch (e) {
            console.log('Failed to store analytics data locally:', e);
        }

        console.log('Event tracked locally:', eventName, parameters);

        // Optionally send to your own analytics endpoint
        this.sendToCustomEndpoint(event);
    }

    /**
     * Send analytics data to your own server
     */
    async sendToCustomEndpoint(event) {
        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.log('Failed to send analytics to custom endpoint:', error);
        }
    }

    /**
     * Track page views
     */
    trackPageView(page_title, page_location) {
        this.trackEvent('page_view', {
            page_title: page_title || document.title,
            page_location: page_location || window.location.href
        });
    }

    /**
     * Track user interactions
     */
    trackUserInteraction(action, element) {
        this.trackEvent('user_interaction', {
            action: action,
            element: element,
            timestamp: Date.now()
        });
    }

    /**
     * Get stored analytics data
     */
    getStoredAnalytics() {
        try {
            const stored = localStorage.getItem('urbannest_analytics');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Clear stored analytics data
     */
    clearStoredAnalytics() {
        try {
            localStorage.removeItem('urbannest_analytics');
            this.fallbackAnalytics = [];
        } catch (e) {
            console.log('Failed to clear analytics data:', e);
        }
    }
}

// Initialize analytics helper
const analyticsHelper = new AnalyticsHelper();

// Enhanced gtag function that falls back gracefully
window.gtagFallback = function (command, ...args) {
    try {
        // Try original gtag first
        if (typeof gtag !== 'undefined') {
            return gtag(command, ...args);
        }
    } catch (error) {
        console.log('gtag failed, using fallback:', error);
    }

    // Fallback implementation
    if (command === 'event') {
        const [eventName, parameters] = args;
        analyticsHelper.trackEvent(eventName, parameters);
    } else if (command === 'config') {
        console.log('Google Analytics config would be:', args);
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsHelper, analyticsHelper };
}

// Global access
window.analyticsHelper = analyticsHelper;

// Auto-track page load
document.addEventListener('DOMContentLoaded', function () {
    analyticsHelper.trackPageView();
});

console.log('Analytics Helper initialized - resilient to ad blockers');
