const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ParkingLot = require('../models/ParkingLot');
const { validationResult } = require('express-validator');

// @desc    Create a booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { parkingLotId, slotId, startTime, endTime, vehicleNumber, vehicleType } = req.body;

  try {
    // Check slot exists
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Check for time conflicts
    const conflict = await Booking.findOne({
      slot: slotId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
        { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gte: new Date(endTime) },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked for the selected time period.',
      });
    }

    const parkingLot = await ParkingLot.findById(parkingLotId);
    if (!parkingLot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    // Calculate duration and amount
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const totalAmount = durationHours * parkingLot.pricePerHour;

    const booking = await Booking.create({
      user: req.user._id,
      parkingLot: parkingLotId,
      slot: slotId,
      startTime: start,
      endTime: end,
      duration: durationHours,
      totalAmount,
      vehicleNumber,
      vehicleType: vehicleType || 'car',
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    // Update slot status
    await Slot.findByIdAndUpdate(slotId, {
      status: 'booked',
      currentBooking: booking._id,
    });

    // Update available slots count
    await ParkingLot.findByIdAndUpdate(parkingLotId, {
      $inc: { availableSlots: -1 },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('parkingLot', 'name address pricePerHour')
      .populate('slot', 'slotNumber floor type');

    // Emit socket event if io is available
    if (req.io) {
      req.io.emit('slotUpdated', { slotId, status: 'booked', parkingLotId });
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('parkingLot', 'name address city pricePerHour')
      .populate('slot', 'slotNumber floor type')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('parkingLot', 'name address city pricePerHour')
      .populate('slot', 'slotNumber floor type');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Free up the slot
    await Slot.findByIdAndUpdate(booking.slot, {
      status: 'available',
      currentBooking: null,
    });

    // Update available slots count
    await ParkingLot.findByIdAndUpdate(booking.parkingLot, {
      $inc: { availableSlots: 1 },
    });

    // Emit socket event if io is available
    if (req.io) {
      req.io.emit('slotUpdated', {
        slotId: booking.slot,
        status: 'available',
        parkingLotId: booking.parkingLot,
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Refund will be processed.',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getBooking, cancelBooking };
