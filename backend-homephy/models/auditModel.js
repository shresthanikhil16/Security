const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: [true, "Action is required"] },
    userEmail: { type: String, required: [true, "User email is required"] },
    details: { type: String, required: [true, "Details are required"] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);