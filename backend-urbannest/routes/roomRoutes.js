const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createRoom,
  getAllRooms,
  getRoomById,
  getNearbyRooms,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");

// Admin-only routes
router.post("/", protect, authorize("admin"), createRoom);
router.put("/:id", protect, authorize("admin"), updateRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

// Public routes
router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.post("/nearby", getNearbyRooms);

module.exports = router;