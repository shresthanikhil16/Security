const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema({
    title: { type: String, required: true },
    address: { type: String, required: true },
    rentPrice: { type: Number, required: true },
    bedrooms: { type: Number, required: false },
    bathrooms: { type: Number, required: true },
    parking: { type: String, enum: ["available", "not available"], required: true },
    contactNo: { type: String, required: true },
    flatImage: { type: String, required: false },
    floor: { type: String, required: true },
    location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    createdAt: { type: Date, default: Date.now },
});

flatSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Flat", flatSchema);