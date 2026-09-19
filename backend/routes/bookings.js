const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getBookingById,
  updateBookingStatus, 
  cancelBooking, 
  rescheduleBooking,
  getRecentBookings 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/recent', protect, getRecentBookings);

router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id')
  .get(protect, getBookingById)
  .put(protect, updateBookingStatus);

router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, rescheduleBooking);

module.exports = router;

