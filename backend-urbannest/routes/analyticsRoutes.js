const express = require("express");
const router = express.Router();
const { trackEvent, getAnalyticsSummary } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");

// Public endpoint for tracking events (when Google Analytics is blocked)
router.post("/track", trackEvent);

// Protected endpoint for getting analytics summary (admin only)
router.get("/summary", protect, authorize("admin"), getAnalyticsSummary);

module.exports = router;
