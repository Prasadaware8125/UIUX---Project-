const express = require('express');
const {
  getParkingLots,
  getParkingLot,
  getSlots,
  getStats,
} = require('../controllers/parkingController');

const router = express.Router();

router.get('/stats', getStats);
router.get('/', getParkingLots);
router.get('/:id', getParkingLot);
router.get('/:id/slots', getSlots);

module.exports = router;
