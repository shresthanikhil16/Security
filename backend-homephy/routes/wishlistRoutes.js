const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware'); // Corrected import
const User = require('../models/User');
const asyncHandler = require('../middleware/async');

// Add room to wishlist
router.post('/wishlist/add/:roomId', verifyToken, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }
    if (!user.wishlist.includes(req.params.roomId)) {
      user.wishlist.push(req.params.roomId);
      await user.save();
    }
    res.status(200).json({ message: "Added to wishlist" });
  } catch (error) {
    console.error('Wishlist add error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
}));

// Get user's wishlist
router.get('/wishlist', verifyToken, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.wishlist || []);
  } catch (error) {
    console.error('Wishlist get error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
}));

// Remove room from wishlist
router.delete('/wishlist/remove/:roomId', verifyToken, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.roomId);
    await user.save();
    res.status(200).json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error('Wishlist remove error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
}));

module.exports = router;