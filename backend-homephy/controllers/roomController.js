const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const fs = require("fs");
const Room = require("../models/roomsModel");
const upload = require("../middleware/upload");
const { sanitizeRoomInput, sanitizeFileName, sanitizeInput } = require("../utils/xssProtection");

// Validation middleware for room creation and update
const validateRoom = [
  body("roomDescription").optional().notEmpty().withMessage("Room description cannot be empty"),
  body("floor").optional().isNumeric().withMessage("Floor must be a number"),
  body("address").optional().notEmpty().withMessage("Address cannot be empty"),
  body("rentPrice").optional().isNumeric().withMessage("Rent price must be a number"),
  body("parking").optional().isIn(["available", "not available"]).withMessage("Invalid parking value"),
  body("contactNo").optional().notEmpty().withMessage("Contact number cannot be empty"),
  body("bathroom").optional().isNumeric().withMessage("Bathroom count must be a number"),
  body("location").optional().custom((value) => {
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

// Validation middleware for room creation (stricter)
const validateRoomCreation = [
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
    // Log incoming request data for debugging
    console.log('Create room request body:', req.body);
    console.log('Create room request file:', req.file);

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Sanitize all text inputs using XSS protection utility
    const sanitizedData = sanitizeRoomInput(req.body);
    const { roomDescription, floor, address, rentPrice, parking, contactNo, bathroom, location } = sanitizedData;

    // Debug logging
    console.log("Room creation - Original body:", req.body);
    console.log("Room creation - Sanitized data:", sanitizedData);
    console.log("Room creation - rentPrice value:", rentPrice, "type:", typeof rentPrice);

    // Sanitize uploaded file name if present
    let roomImage = "";
    if (req.file) {
      const sanitizedFileName = sanitizeFileName(req.file.originalname);
      roomImage = req.file.path;
    }

    // Validate file type
    if (req.file) {
      const fileExtension = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf("."));
      const allowedTypes = [".jpg", ".jpeg", ".png", ".gif"];
      if (!allowedTypes.includes(fileExtension) || !["image/jpeg", "image/png", "image/gif"].includes(req.file.mimetype)) {
        if (fs.existsSync(roomImage)) fs.unlinkSync(roomImage); // Clean up uploaded file
        return res.status(400).json({ success: false, message: "Only JPEG, PNG, and GIF images are allowed." });
      }
    }

    const roomData = {
      roomDescription,
      floor: Number(floor),
      address,
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

    // Determine the protocol based on request
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('host')}`;

    // Format rooms with proper image URLs
    const formattedRooms = rooms.map(room => ({
      ...room.toObject(),
      id: room._id.toString(), // Add explicit ID field
      roomImage: room.roomImage ? `${baseUrl}/${room.roomImage.replace(/\\/g, '/')}` : `${baseUrl}/fallback-image.png`
    }));

    res.status(200).json({ success: true, rooms: formattedRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching rooms", error: error.message });
  }
};

// Get a single room by ID
const getRoomById = async (req, res) => {
  try {
    console.log("Fetching room by ID:", req.params.id);

    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log("Room not found for ID:", req.params.id);
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Log the room data for debugging
    console.log("Raw room data from database:", room);

    // Determine the protocol based on request
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('host')}`;

    // Sanitize and format the room data for frontend
    const sanitizedRoom = {
      _id: room._id,
      id: room._id.toString(), // Add explicit ID field for frontend
      roomDescription: sanitizeInput(room.roomDescription || ''),
      floor: room.floor || 0,
      address: sanitizeInput(room.address || ''),
      rentPrice: room.rentPrice || 0,
      parking: sanitizeInput(room.parking || ''),
      contactNo: sanitizeInput(room.contactNo || ''),
      contact: sanitizeInput(room.contactNo || ''), // Alias for frontend compatibility
      bathroom: room.bathroom || 0,
      bathrooms: room.bathroom || 0, // Alias for frontend compatibility  
      roomImage: room.roomImage ? `${baseUrl}/${room.roomImage.replace(/\\/g, '/')}` : `${baseUrl}/fallback-image.png`,
      location: room.location || { type: "Point", coordinates: [0, 0] },
      createdAt: room.createdAt
    };

    console.log("Sanitized room data being sent:", sanitizedRoom);

    res.status(200).json({
      success: true,
      room: sanitizedRoom,
      debug: {
        originalFields: {
          hasAddress: !!room.address,
          hasFloor: !!room.floor,
          hasParking: !!room.parking,
          hasContactNo: !!room.contactNo,
          hasBathroom: !!room.bathroom
        }
      }
    });
  } catch (error) {
    console.error("Error fetching room:", error);
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
    console.log('=== UPDATE ROOM DEBUG ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User:', req.user);

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Sanitize all text inputs using XSS protection utility
    const sanitizedData = sanitizeRoomInput(req.body);
    const { roomDescription, floor, address, rentPrice, parking, contactNo, bathroom, location } = sanitizedData;

    // Debug logging
    console.log("Room update - Original body:", req.body);
    console.log("Room update - Sanitized data:", sanitizedData);
    console.log("Room update - rentPrice value:", rentPrice, "type:", typeof rentPrice);

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

    const updateData = {
      roomDescription,
      floor: Number(floor),
      address,
      rentPrice: Number(rentPrice),
      parking,
      contactNo,
      bathroom: Number(bathroom),
      location: location ? JSON.parse(location) : undefined,
    };

    // Only add roomImage if a new file was uploaded
    if (roomImage) {
      updateData.roomImage = roomImage;
    }

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
  createRoom,
  getAllRooms,
  getRoomById,
  getNearbyRooms,
  updateRoom,
  deleteRoom,
  validateRoom, // Export validation for use in routes (flexible for updates)
  validateRoomCreation, // Export stricter validation for creation
};