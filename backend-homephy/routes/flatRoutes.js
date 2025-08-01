const express = require("express");
const router = express.Router();
const Flat = require("../models/flatModel");
const multer = require("multer");
const { sanitizeInput } = require("../utils/xssProtection");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/", upload.single("flatImage"), async (req, res) => {
    try {
        const { title, address, rentPrice, bathrooms, parking, contactNo, floor, location } = req.body;
        const flatImage = req.file ? `/uploads/${req.file.filename}` : null;

        const flat = new Flat({
            title,
            address,
            rentPrice: Number(rentPrice),
            bathrooms: Number(bathrooms),
            parking,
            contactNo,
            floor,
            flatImage,
            location: JSON.parse(location),
        });

        await flat.save();
        res.status(201).json({ message: "Flat added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single flat by ID
router.get("/:id", async (req, res) => {
    try {
        console.log("Fetching flat by ID:", req.params.id);

        const flat = await Flat.findById(req.params.id);
        if (!flat) {
            console.log("Flat not found for ID:", req.params.id);
            return res.status(404).json({ success: false, message: "Flat not found" });
        }

        // Log the flat data for debugging
        console.log("Raw flat data from database:", flat);

        // Sanitize and format the flat data for frontend
        const sanitizedFlat = {
            _id: flat._id,
            title: sanitizeInput(flat.title || ''),
            address: sanitizeInput(flat.address || ''),
            rentPrice: flat.rentPrice || 0,
            bedrooms: flat.bedrooms || 0,
            bathrooms: flat.bathrooms || 0,
            parking: sanitizeInput(flat.parking || ''),
            contactNo: sanitizeInput(flat.contactNo || ''),
            contact: sanitizeInput(flat.contactNo || ''), // Alias for frontend compatibility
            flatImage: flat.flatImage ? sanitizeInput(flat.flatImage) : null,
            floor: sanitizeInput(flat.floor || ''),
            location: flat.location || { type: "Point", coordinates: [0, 0] },
            createdAt: flat.createdAt
        };

        console.log("Sanitized flat data being sent:", sanitizedFlat);

        res.status(200).json({
            success: true,
            flat: sanitizedFlat,
            debug: {
                originalFields: {
                    hasTitle: !!flat.title,
                    hasAddress: !!flat.address,
                    hasFloor: !!flat.floor,
                    hasParking: !!flat.parking,
                    hasContactNo: !!flat.contactNo,
                    hasBathrooms: !!flat.bathrooms
                }
            }
        });
    } catch (error) {
        console.error("Error fetching flat:", error);
        res.status(500).json({ success: false, message: "Error fetching flat", error: error.message });
    }
});

router.post("/nearby", async (req, res) => {
    try {
        const { latitude, longitude, radius, maxPrice, bedrooms, parking } = req.body;
        const query = {
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: radius || 5000,
                },
            },
        };
        if (maxPrice) query.rentPrice = { $lte: maxPrice };
        if (bedrooms) query.bedrooms = { $gte: bedrooms };
        if (parking) query.parking = parking;
        const flats = await Flat.find(query).limit(10);
        res.status(200).json(flats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;