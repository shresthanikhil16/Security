const asyncHandler = require("../middleware/async");
const AuditLog = require("../models/auditLog");

const getAuditLogs = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
    }
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, logs });
});

module.exports = { getAuditLogs };