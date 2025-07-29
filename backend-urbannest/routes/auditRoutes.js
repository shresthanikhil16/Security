const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getAuditLogs } = require("../controllers/auditController");

// Protected route for admin users only to access audit logs
router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);

module.exports = router;