const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const User = require("../models/User");
const { sanitizeUserInput, sanitizeInput } = require("../utils/xssProtection");

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
    // Sanitize input data to prevent XSS
    const sanitizedBody = sanitizeUserInput(req.body);
    const { name, email, password, confirm_password, role = "user", recaptchaToken } = sanitizedBody;

    console.log("Register request body:", req.body);

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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const otp = randomstring.generate({ length: 6, charset: "numeric" });

        const user = new User({
            name,
            email,
            password, // Will be validated and hashed in the User model
            role,
            otp,
            otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        await user.save();

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
    const { otp } = req.body;
    try {
        const user = await User.findOne({ otp, otpExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Update without triggering pre('save') hook
        await User.updateOne(
            { _id: user._id },
            {
                $set: { isVerified: true },
                $unset: { otp: "", otpExpires: "" },
            }
        );

        res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const loginUser = async (req, res) => {
    // Sanitize input data to prevent XSS
    const sanitizedBody = sanitizeUserInput(req.body);
    const { email, password, recaptchaToken } = sanitizedBody;

    console.log("Login request body:", req.body);
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (user.passwordExpires < Date.now()) {
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

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate reset token (6-digit OTP)
        const resetToken = randomstring.generate({ length: 6, charset: "numeric" });

        // Set reset token and expiry (10 minutes)
        user.otp = resetToken;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send reset email
        await sendEmail(
            email,
            "Password Reset Request",
            `<p>You requested a password reset. Your reset code is <b>${resetToken}</b>.</p>
             <p>This code will expire in 10 minutes.</p>
             <p>If you didn't request this, please ignore this email.</p>`
        );

        res.status(200).json({
            success: true,
            message: "Password reset code sent to your email"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Error sending reset email",
            error: error.message
        });
    }
};

const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Email, OTP, and new password are required"
        });
    }

    try {
        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset code"
            });
        }

        // Validate password complexity
        if (!user.validatePasswordComplexity(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be 8-50 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Check if new password was used recently
        const isPasswordReused = await user.isPasswordReused(newPassword);
        if (isPasswordReused) {
            return res.status(400).json({
                success: false,
                message: 'Cannot reuse a recent password. Please choose a different password.'
            });
        }

        // Update password (this will trigger the pre-save middleware)
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error);
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
        const user = await User.findOne({
            email,
            otp,
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