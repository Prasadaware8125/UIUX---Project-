const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parking lot name is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Price per hour is required'],
    min: [0, 'Price cannot be negative'],
  },
  totalSlots: {
    type: Number,
    required: true,
    min: 1,
  },
  availableSlots: {
    type: Number,
    required: true,
  },
  coordinates: {
    lat: { type: Number, default: 18.5204 },
    lng: { type: Number, default: 73.8567 },
  },
  amenities: [String],
  image: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
