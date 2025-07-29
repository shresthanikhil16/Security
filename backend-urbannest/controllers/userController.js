const asyncHandler = require("../middleware/async");
const bcrypt = require('bcrypt');
const User = require("../models/User");
const jwt = require('jsonwebtoken');

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.status(200).json({ success: true, users });
};

const updateUser = asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    try {
        // Check if password is being updated
        if (req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'Password changes are not allowed through this endpoint. Please use the dedicated change-password endpoint.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;

        await user.save();
        res.status(200).json({ success: true, message: 'User updated successfully', user: user.toObject({ getters: true }) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Error updating user' });
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    try {
        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Security check: users can only change their own password unless they're admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only change your own password'
            });
        }

        // Find user with password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password meets complexity requirements
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
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error changing password'
        });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

module.exports = {
    getUserById,
    getAllUsers,
    updateUser,
    changePassword,
    authenticateToken,
};