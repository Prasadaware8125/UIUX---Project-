const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');

// @desc    Get all parking lots
// @route   GET /api/parking
const getParkingLots = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, search } = req.query;
    let query = { isActive: true };

    if (city) query.city = new RegExp(city, 'i');

    // search name OR address
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
      ];
    }

    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    const lots = await ParkingLot.find(query).sort({ availableSlots: -1 });
    res.json({ success: true, count: lots.length, data: lots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single parking lot with slots
// @route   GET /api/parking/:id
const getParkingLot = async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) return res.status(404).json({ success: false, message: 'Parking lot not found' });

    const slots = await Slot.find({ parkingLot: req.params.id }).populate(
      'currentBooking', 'startTime endTime status user'
    );

    res.json({ success: true, data: { lot, slots } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get slots for a parking lot with time-based availability
// @route   GET /api/parking/:id/slots
const getSlots = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    const slots = await Slot.find({ parkingLot: req.params.id });

    if (date && startTime && endTime) {
      const Booking = require('../models/Booking');
      const requestStart = new Date(`${date}T${startTime}`);
      const requestEnd = new Date(`${date}T${endTime}`);

      const conflictingBookings = await Booking.find({
        parkingLot: req.params.id,
        status: { $in: ['confirmed', 'active'] },
        $or: [
          { startTime: { $lt: requestEnd, $gte: requestStart } },
          { endTime: { $gt: requestStart, $lte: requestEnd } },
          { startTime: { $lte: requestStart }, endTime: { $gte: requestEnd } },
        ],
      }).select('slot');

      const bookedSlotIds = conflictingBookings.map((b) => b.slot.toString());

      const slotsWithAvailability = slots.map((slot) => ({
        ...slot.toObject(),
        isAvailableForTime: !bookedSlotIds.includes(slot._id.toString()),
      }));

      return res.json({ success: true, data: slotsWithAvailability });
    }

    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get parking stats
// @route   GET /api/parking/stats
const getStats = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const totalLots = await ParkingLot.countDocuments({ isActive: true });
    const totalSlots = await Slot.countDocuments();
    const availableSlots = await Slot.countDocuments({ status: 'available' });
    const totalBookings = await Booking.countDocuments({ status: { $ne: 'cancelled' } });

    res.json({ success: true, data: { totalLots, totalSlots, availableSlots, totalBookings } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getParkingLots, getParkingLot, getSlots, getStats };
