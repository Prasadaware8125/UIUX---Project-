const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('parkingLotId').notEmpty().withMessage('Parking lot is required'),
    body('slotId').notEmpty().withMessage('Slot is required'),
    body('startTime').notEmpty().withMessage('Start time is required'),
    body('endTime').notEmpty().withMessage('End time is required'),
    body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  ],
  createBooking
);

router.get('/my', getMyBookings);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
