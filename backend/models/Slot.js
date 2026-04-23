const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  slotNumber: {
    type: String,
    required: true,
  },
  floor: {
    type: String,
    default: 'G',
  },
  type: {
    type: String,
    enum: ['standard', 'compact', 'handicapped', 'ev'],
    default: 'standard',
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available',
  },
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
});

slotSchema.index({ parkingLot: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
