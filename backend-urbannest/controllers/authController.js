const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const User = require("../models/User");

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
    const { name, email, password, confirm_password, role = "user", recaptchaToken } = req.body;
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
    const { email, password, recaptchaToken } = req.body;
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

module.exports = { registerUser, verifyOTP, loginUser };