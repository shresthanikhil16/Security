// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { updateUser, getAllUsers, getUserById, changePassword, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Update user by ID
router.get('/customer/:id ', getUserById);
router.put('/update/:id', updateUser);
router.put('/change-password/:id', protect, changePassword);
router.get('/customer', getAllUsers);
// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// 🔐 SECURE DELETE USER ROUTE - Protected with authentication
router.delete('/delete/:id', (req, res, next) => {
  console.log("🔍 DEBUG: DELETE route accessed");
  console.log("🔍 Authorization header:", req.headers.authorization || "MISSING");
  console.log("🔍 All headers:", Object.keys(req.headers).join(", "));
  next();
}, protect, deleteUser);

module.exports = router;