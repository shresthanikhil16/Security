const express = require("express");
const router = express.Router();
const Flat = require("../models/flatModel");
const multer = require("multer");

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