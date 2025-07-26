const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const fs = require("fs");
const Room = require("../models/roomsModel");
const upload = require("../middleware/upload");

// Validation middleware for room creation and update
const validateRoom = [
  body("roomDescription").notEmpty().withMessage("Room description is required"),
  body("floor").isNumeric().withMessage("Floor must be a number"),
  body("address").notEmpty().withMessage("Address is required"),
  body("rentPrice").isNumeric().withMessage("Rent price must be a number"),
  body("parking").isIn(["available", "not available"]).withMessage("Invalid parking value"),
  body("contactNo").notEmpty().withMessage("Contact number is required"),
  body("bathroom").isNumeric().withMessage("Bathroom count must be a number"),
  body("location").custom((value) => {
    try {
      const loc = JSON.parse(value);
      if (loc.type !== "Point" || !Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) {
        throw new Error("Invalid location format");
      }
      return true;
    } catch (error) {
      throw new Error("Invalid location format");
    }
  }),
];

// Create a new room
const createRoom = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { roomDescription, floor, address, rentPrice, parking, contactNo, bathroom, location } = req.body;
    const roomImage = req.file ? req.file.path : "";

    // Validate file type
    if (req.file) {
      const fileExtension = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf("."));
      const allowedTypes = [".jpg", ".jpeg", ".png", ".gif"];
      if (!allowedTypes.includes(fileExtension) || !["image/jpeg", "image/png", "image/gif"].includes(req.file.mimetype)) {
        if (fs.existsSync(roomImage)) fs.unlinkSync(roomImage); // Clean up uploaded file
        return res.status(400).json({ success: false, message: "Only JPEG, PNG, and GIF images are allowed." });
      }
    }

    // Sanitize text inputs
    const sanitizedRoomDescription = sanitizeHtml(roomDescription);
    const sanitizedAddress = sanitizeHtml(address);

    const roomData = {
      roomDescription: sanitizedRoomDescription,
      floor: Number(floor),
      address: sanitizedAddress,
      rentPrice: Number(rentPrice),
      parking,
      contactNo,
      bathroom: Number(bathroom),
      roomImage,
      location: JSON.parse(location),
    };

    const newRoom = new Room(roomData);
    await newRoom.save();

    res.status(201).json({ success: true, message: "Room added successfully", room: newRoom });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Clean up on error
    res.status(500).json({ success: false, message: "Error adding room", error: error.message });
  }
};

// Get all rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: "No rooms found" });
    }
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching rooms", error: error.message });
  }
};

// Get a single room by ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching room", error: error.message });
  }
};

// Get nearby rooms
const getNearbyRooms = async (req, res) => {
  try {
    const { latitude, longitude, radius, maxPrice, bathroom, parking, page = 1, limit = 10 } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    const query = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
          $maxDistance: Number(radius) || 5000, // Default 5km
        },
      },
    };

    if (maxPrice) query.rentPrice = { $lte: Number(maxPrice) };
    if (bathroom) query.bathroom = { $gte: Number(bathroom) };
    if (parking) query.parking = parking;

    const rooms = await Room.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ rentPrice: 1 });

    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching nearby rooms", error: error.message });
  }
};

// Update room by ID
const updateRoom = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { roomDescription, floor, address, rentPrice, parking, contactNo, bathroom, location } = req.body;
    const roomImage = req.file ? req.file.path : undefined;

    // Validate file type
    if (req.file) {
      const fileExtension = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf("."));
      const allowedTypes = [".jpg", ".jpeg", ".png", ".gif"];
      if (!allowedTypes.includes(fileExtension) || !["image/jpeg", "image/png", "image/gif"].includes(req.file.mimetype)) {
        if (fs.existsSync(roomImage)) fs.unlinkSync(roomImage); // Clean up uploaded file
        return res.status(400).json({ success: false, message: "Only JPEG, PNG, and GIF images are allowed." });
      }
    }

    // Sanitize text inputs
    const sanitizedRoomDescription = sanitizeHtml(roomDescription);
    const sanitizedAddress = sanitizeHtml(address);

    const updateData = {
      roomDescription: sanitizedRoomDescription,
      floor: Number(floor),
      address: sanitizedAddress,
      rentPrice: Number(rentPrice),
      parking,
      contactNo,
      bathroom: Number(bathroom),
      location: location ? JSON.parse(location) : undefined,
      roomImage,
    };

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedRoom) {
      if (roomImage && fs.existsSync(roomImage)) fs.unlinkSync(roomImage); // Clean up on error
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.status(200).json({ success: true, message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Clean up on error
    res.status(500).json({ success: false, message: "Error updating room", error: error.message });
  }
};

// Delete room by ID
const deleteRoom = async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    // Optionally, delete the associated image file
    if (deletedRoom.roomImage && fs.existsSync(deletedRoom.roomImage)) {
      fs.unlinkSync(deletedRoom.roomImage);
    }
    res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting room", error: error.message });
  }
};

module.exports = {
  createRoom: [...validateRoom, upload.single("roomImage"), createRoom],
  getAllRooms,
  getRoomById,
  getNearbyRooms,
  updateRoom: [...validateRoom, upload.single("roomImage"), updateRoom],
  deleteRoom,
};