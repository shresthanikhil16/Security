const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const User = require("../models/User");
const { sanitizeUserInput, sanitizeInput } = require("../utils/xssProtection");
const { sanitizeInput: noSqlSanitize } = require("../middleware/noSqlInjection");

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `UrbanNest <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

const registerUser = async (req, res) => {
    console.log("🛡️ REGISTRATION REQUEST - Enhanced Security Processing");

    // 🛡️ Apply comprehensive input sanitization (XSS + NoSQL injection)
    const xssSanitized = sanitizeUserInput(req.body);
    const fullySanitized = noSqlSanitize(xssSanitized, 'registration');
    const { name, email, password, confirm_password, role = "user", recaptchaToken } = fullySanitized;

    console.log("✅ Input sanitization complete:");
    console.log("  - XSS protection applied");
    console.log("  - NoSQL injection protection applied");
    console.log("  - Request body sanitized");

    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (!confirm_password) missingFields.push("confirm_password");
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(", ")}` });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    try {
        // 🔐 Secure database query with sanitized email
        const existingUser = await User.findOne({ email: noSqlSanitize(email, 'email_lookup') });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // 🔐 Generate cryptographically secure OTP
        const otp = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character hex OTP

        console.log("🔐 Creating user with secure password hashing:");
        console.log("  - Password will be hashed with bcrypt");
        console.log("  - OTP generated with crypto.randomBytes");
        console.log("  - All sensitive data will be hashed before storage");

        const user = new User({
            name: noSqlSanitize(name, 'user_name'),
            email: noSqlSanitize(email, 'user_email'),
            password, // 🔐 Will be validated and hashed in the User model pre-save hook
            role: noSqlSanitize(role, 'user_role'),
            otp: crypto.createHash('sha256').update(otp).digest('hex'), // 🔐 Hash OTP before storage
            otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        await user.save();

        console.log("✅ User created successfully:");
        console.log("  - Password hashed with bcrypt");
        console.log("  - OTP hashed with SHA-256");
        console.log("  - All data sanitized and secure");

        await sendEmail(
            email,
            "Verify Your Email",
            `<p>Your OTP for registration is <b>${otp}</b>. It expires in 10 minutes.</p>`
        );

        res.status(200).json({ success: true, message: "Registration successful. Please check your email for OTP." });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

const verifyOTP = async (req, res) => {
    console.log("🔐 OTP VERIFICATION - Enhanced Security Processing");

    // 🛡️ Sanitize input to prevent injection attacks
    const sanitizedInput = noSqlSanitize(req.body, 'otp_verification');
    const { otp } = sanitizedInput;

    if (!otp) {
        return res.status(400).json({ success: false, message: "OTP is required" });
    }

    try {
        // 🔐 Hash the provided OTP to compare with stored hash
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        console.log("🔐 Verifying hashed OTP:");
        console.log("  - Received OTP hashed for comparison");
        console.log("  - Searching for user with matching hash");

        // Find user with matching hashed OTP and valid expiry
        const user = await User.findOne({
            otp: hashedOtp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log("❌ OTP verification failed: Invalid or expired OTP");
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        console.log("✅ OTP verified successfully for user:", user.email);

        // 🔐 Update user securely without triggering pre('save') hook
        await User.updateOne(
            { _id: user._id },
            {
                $set: { isVerified: true },
                $unset: { otp: "", otpExpires: "" }, // Clear OTP data after successful verification
            }
        );

        console.log("✅ User verification complete:");
        console.log("  - Email verified successfully");
        console.log("  - OTP data cleared from database");

        res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("💥 OTP verification error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const loginUser = async (req, res) => {
    console.log("🛡️ LOGIN REQUEST - Enhanced Security Processing");

    // 🛡️ Apply comprehensive input sanitization (XSS + NoSQL injection)
    const xssSanitized = sanitizeUserInput(req.body);
    const fullySanitized = noSqlSanitize(xssSanitized, 'login');
    const { email, password, recaptchaToken } = fullySanitized;

    console.log("✅ Login input sanitization complete");

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        // 🔐 Secure database query with sanitized email
        const user = await User.findOne({ email: noSqlSanitize(email, 'login_email') });
        if (!user) {
            console.log("❌ Login failed: User not found for email:", email);
            return res.status(400).json({ success: false, message: "Invalid credentials" }); // Generic message for security
        }

        // Check password expiry
        if (user.passwordExpires < Date.now()) {
            console.log("❌ Login failed: Password expired for user:", user.email);
            return res.status(400).json({ success: false, message: "Password has expired. Please reset your password." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            role: user.role,
            name: user.name,
            _id: user._id,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Error logging in", error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    console.log("🔍 Password reset request received:");
    console.log("  - Email:", email);
    console.log("  - Request IP:", req.ip);
    console.log("  - Request body:", JSON.stringify(req.body, null, 2));

    if (!email) {
        console.log("❌ Email validation failed: Email is required");
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        // Apply comprehensive input sanitization (XSS + NoSQL injection protection)
        const xssSanitizedEmail = sanitizeUserInput(email);
        const fullyCleanEmail = noSqlSanitize(xssSanitizedEmail);
        console.log("✅ Email fully sanitized:", fullyCleanEmail);

        const user = await User.findOne({ email: fullyCleanEmail });
        console.log("👤 User lookup result:", user ? "User found" : "User not found");

        if (!user) {
            // Don't reveal if email exists (security best practice)
            console.log("⚠️ Email not found in database, but returning success message for security");
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent."
            });
        }

        // 🔐 Generate cryptographically secure reset token (32 bytes = 256 bits)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 🔐 Hash the token with SHA-256 before storing in database
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set hashed token and expiry (1 hour)
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        // Clear any existing OTP fields for security
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        console.log(`🔐 Generated secure reset token for ${fullyCleanEmail}`);
        console.log(`  - Token (unhashed, will be sent to user): ${resetToken.substring(0, 16)}...`);
        console.log(`  - Hashed token (stored in DB): ${hashedToken.substring(0, 16)}...`);
        console.log(`  - Expires at: ${new Date(user.passwordResetExpires).toISOString()}`);

        // Import email controller
        const { sendPasswordResetEmail } = require('./emailController');

        // Send reset email with unhashed token (user will use this)
        try {
            await sendPasswordResetEmail(fullyCleanEmail, resetToken);

            console.log(`✅ Secure password reset email sent successfully to ${fullyCleanEmail}`);

            res.status(200).json({
                success: true,
                message: "Password reset link sent to your email successfully."
            });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);

            // Clear the reset token since email failed
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            return res.status(500).json({
                success: false,
                message: "Failed to send reset email. Please try again later.",
                error: "Email service temporarily unavailable"
            });
        }
    } catch (error) {
        console.error("💥 Forgot password error details:");
        console.error("  - Error message:", error.message);
        console.error("  - Error stack:", error.stack);
        console.error("  - Request data:", JSON.stringify(req.body, null, 2));

        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.query; // Token from URL query parameter
    const { newPassword } = req.body;

    console.log("🔑 Password reset attempt:");
    console.log("  - Token (unhashed):", token ? `${token.substring(0, 16)}...` : "Not provided");
    console.log("  - New password length:", newPassword ? newPassword.length : "Not provided");
    console.log("  - Request IP:", req.ip);

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required"
        });
    }

    try {
        // Apply comprehensive input sanitization to token and password
        const xssSanitizedToken = sanitizeUserInput(token);
        const fullyCleanToken = noSqlSanitize(xssSanitizedToken);

        const xssSanitizedPassword = sanitizeUserInput(newPassword);
        const fullyCleanPassword = noSqlSanitize(xssSanitizedPassword);

        console.log("✅ Input sanitization completed for reset password");

        // 🔐 Hash the received token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(fullyCleanToken).digest('hex');
        console.log(`🔐 Hashed received token: ${hashedToken.substring(0, 16)}...`);

        // Find user with matching hashed token and valid expiry
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log("❌ Invalid or expired reset token");
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token. Please request a new password reset."
            });
        }

        console.log(`✅ Valid reset token for user: ${user.email}`);
        console.log(`  - Token expires at: ${new Date(user.passwordResetExpires).toISOString()}`);

        // Validate password complexity using sanitized password
        if (!user.validatePasswordComplexity(fullyCleanPassword)) {
            console.log("❌ Password complexity validation failed");
            return res.status(400).json({
                success: false,
                message: 'Password must be 8-50 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Check if new password was used recently using sanitized password
        const isPasswordReused = await user.isPasswordReused(fullyCleanPassword);
        if (isPasswordReused) {
            console.log("❌ Password reuse detected");
            return res.status(400).json({
                success: false,
                message: 'Cannot reuse a recent password. Please choose a different password.'
            });
        }

        console.log("✅ Password validation passed, updating password");

        // Update password with sanitized input (this will trigger the pre-save middleware for hashing)
        user.password = fullyCleanPassword;

        // 🔐 Clear all reset token fields (single use)
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Also clear any legacy OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        console.log(`✅ Password reset successful for user: ${user.email}`);
        console.log(`  - Reset token invalidated (single use)`);
        console.log(`  - Password updated with new hash`);

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        console.error("💥 Reset password error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error resetting password"
        });
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
    }

    try {
        // Apply comprehensive input sanitization (XSS + NoSQL injection protection)
        const xssSanitizedEmail = sanitizeUserInput(email);
        const fullyCleanEmail = noSqlSanitize(xssSanitizedEmail);

        const xssSanitizedOtp = sanitizeUserInput(otp);
        const fullyCleanOtp = noSqlSanitize(xssSanitizedOtp);

        console.log("✅ Input sanitization completed for OTP verification");

        const user = await User.findOne({
            email: fullyCleanEmail,
            otp: fullyCleanOtp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP verified successfully. You can now reset your password."
        });
    } catch (error) {
        console.error("Verify forgot password OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying OTP"
        });
    }
};

module.exports = { registerUser, verifyOTP, loginUser, forgotPassword, resetPassword, verifyForgotPasswordOTP };