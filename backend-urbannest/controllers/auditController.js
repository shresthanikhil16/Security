const asyncHandler = require("../middleware/async");
const AuditLog = require("../models/auditModel");
const { sanitizeInput } = require("../utils/xssProtection");

const getAuditLogs = asyncHandler(async (req, res) => {
    // Enhanced debugging for authentication issues
    console.log("Audit logs request received");
    console.log("User from token:", req.user ? { id: req.user._id, role: req.user.role, email: req.user.email } : "No user");
    console.log("Authorization header:", req.headers.authorization ? "Present" : "Missing");

    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
        console.log("ERROR: No user found in request after authentication");
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in."
        });
    }

    // Check admin role
    if (req.user.role !== "admin") {
        console.log(`ACCESS DENIED: User ${req.user.email} with role ${req.user.role} attempted to access audit logs`);
        return res.status(403).json({
            success: false,
            message: "Admin access required. You don't have permission to view audit logs."
        });
    }

    try {
        // Sanitize query parameters to prevent XSS
        const page = req.query.page ? parseInt(sanitizeInput(req.query.page.toString())) : 1;
        const limit = req.query.limit ? parseInt(sanitizeInput(req.query.limit.toString())) : 10;
        const action = req.query.action ? sanitizeInput(req.query.action) : '';
        const email = req.query.email ? sanitizeInput(req.query.email) : '';

        // Build query filter
        const filter = {};
        if (action && action.trim() !== '') {
            filter.action = { $regex: action, $options: 'i' };
        }
        if (email && email.trim() !== '') {
            filter.userEmail = { $regex: email, $options: 'i' };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Fetch logs with pagination and filtering
        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance

        // Get total count for pagination
        const totalLogs = await AuditLog.countDocuments(filter);

        console.log(`Audit logs fetched successfully: ${logs.length} logs returned (${totalLogs} total)`);

        res.status(200).json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total: totalLogs,
                pages: Math.ceil(totalLogs / limit)
            },
            filter: {
                action: action || 'all',
                email: email || 'all'
            }
        });

    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching audit logs"
        });
    }
});

module.exports = { getAuditLogs };