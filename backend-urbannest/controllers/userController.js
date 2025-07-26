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
    const { name, email, password, role } = req.body;
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (password) {
            user.password = password; // Will be validated and hashed in the User model
        }

        await user.save();
        res.status(200).json({ success: true, message: 'User updated successfully', user: user.toObject({ getters: true }) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Error updating user' });
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
    authenticateToken,
};