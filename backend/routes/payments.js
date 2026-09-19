const express = require('express');
const router = express.Router();
const {
  getKey,
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentByBooking
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/key', getKey);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/booking/:bookingId', protect, getPaymentByBooking);

module.exports = router;
