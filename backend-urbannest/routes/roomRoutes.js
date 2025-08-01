const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  createRoom,
  getAllRooms,
  getRoomById,
  getNearbyRooms,
  updateRoom,
  deleteRoom,
  validateRoom,
  validateRoomCreation,
} = require("../controllers/roomController");

// Admin-only routes
router.post("/", protect, authorize("admin"), upload.single("roomImage"), validateRoomCreation, createRoom);
router.put("/:id", protect, authorize("admin"), upload.single("roomImage"), validateRoom, updateRoom);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

// Public routes
router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.post("/nearby", getNearbyRooms);

module.exports = router;