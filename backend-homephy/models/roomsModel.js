const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomDescription: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  rentPrice: {
    type: Number,
    required: true,
  },
  parking: {
    type: String,
    enum: ['available', 'not available'],
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
  },
  bathroom: {
    type: Number,
    required: true,
  },
  roomImage: {
    type: String,
    required: false,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
});

roomSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Room', roomSchema);