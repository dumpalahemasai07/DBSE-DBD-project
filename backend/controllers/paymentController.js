const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

function cleanEnvVar(val) {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.substring(1, str.length - 1).trim();
  }
  return str;
}

function getRazorpayInstance() {
  const key_id = cleanEnvVar(process.env.RAZORPAY_KEY_ID);
  const key_secret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET);
  
  if (!key_id || !key_secret || key_id.includes('your_razorpay_key_id') || key_secret === 'rzp_test_secret_HomeEaseSecret2026' || key_secret.includes('your_razorpay_key_secret')) {
    const missing = [];
    if (!key_id || key_id.includes('your_razorpay_key_id')) missing.push('RAZORPAY_KEY_ID');
    if (!key_secret || key_secret === 'rzp_test_secret_HomeEaseSecret2026' || key_secret.includes('your_razorpay_key_secret')) missing.push('RAZORPAY_KEY_SECRET');
    throw new Error(`Razorpay Secret in backend/.env is currently a placeholder (${missing.join(', ')}). Please paste the matching Test Key Secret for ${key_id} into backend/.env`);
  }
  return new Razorpay({ key_id, key_secret });
}

// GET /api/payments/key - Public key for frontend checkout
const getKey = (req, res) => {
  res.json({
    success: true,
    keyId: cleanEnvVar(process.env.RAZORPAY_KEY_ID)
  });
};

// POST /api/payments/create-order - Create Razorpay Order from MongoDB Booking amount
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, error: 'Valid bookingId is required' });
    }

    const booking = await Booking.findById(bookingId).populate('customer', 'name email phone');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const customerId = (booking.customer && booking.customer._id) ? booking.customer._id.toString() : (booking.customer ? booking.customer.toString() : '');
    if (req.user.role === 'customer' && customerId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized for this booking' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cannot pay for a cancelled booking' });
    }

    if (booking.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, error: 'Booking is already paid' });
    }

    // Convert totalAmount to INR paise strictly from database booking
    const amountPaise = Math.round(booking.totalAmount * 100);

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (cfgErr) {
      return res.status(400).json({
        success: false,
        error: cfgErr.message
      });
    }

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${booking.bookingNumber}`,
      notes: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (rzpErr) {
      console.error('Razorpay Order Creation Failed:', rzpErr.message || rzpErr);
      return res.status(500).json({
        success: false,
        error: `Razorpay Order Creation Failed: ${rzpErr.description || rzpErr.message || 'Invalid API Credentials'}`
      });
    }

    // Save or update Payment record in MongoDB
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        user: req.user._id,
        booking: booking._id,
        amount: booking.totalAmount,
        currency: 'INR',
        razorpayOrderId: order.id,
        method: req.body.method === 'UPI' ? 'UPI' : 'RAZORPAY',
        status: 'CREATED'
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      success: true,
      razorpayKeyId: (process.env.RAZORPAY_KEY_ID || '').trim(),
      razorpayOrderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      bookingId: booking._id,
      customer: {
        name: booking.customer ? booking.customer.name : req.user.name,
        email: booking.customer ? booking.customer.email : req.user.email,
        phone: booking.customer ? booking.customer.phone : req.user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/verify - Server-side HMAC SHA256 Signature Verification
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ success: false, error: 'Missing required payment verification details' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const keySecret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET);
    if (!keySecret) {
      return res.status(400).json({ success: false, error: 'RAZORPAY_KEY_SECRET is missing in backend/.env' });
    }
    
    // Server-side HMAC SHA256 Signature Verification
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isSignatureValid = (generatedSignature === razorpay_signature);

    if (!isSignatureValid) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'FAILED' }
      );
      return res.status(400).json({ success: false, error: 'Invalid Razorpay payment signature verification' });
    }

    // Update Payment Record in MongoDB
    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        user: booking.customer,
        booking: booking._id,
        amount: booking.totalAmount,
        currency: 'INR',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        method: req.body.method === 'UPI' ? 'UPI' : 'RAZORPAY',
        status: 'PAID',
        paidAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update Booking in MongoDB
    booking.paymentStatus = 'PAID';
    booking.bookingStatus = 'CONFIRMED';
    await booking.save();

    // Create Notification
    await Notification.create({
      user: booking.customer,
      title: `Payment Received for #${booking.bookingNumber}`,
      message: `Payment of ₹${booking.totalAmount} verified successfully via Razorpay. Booking is CONFIRMED.`,
      type: 'BOOKING',
      booking: booking._id
    });

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        paymentStatus: 'PAID',
        bookingStatus: 'CONFIRMED',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: booking.totalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/webhook - Idempotent Razorpay Webhook Event Handler
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_homeease_test_secret_2026';
    const signature = req.headers['x-razorpay-signature'];

    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, error: 'Invalid Webhook Signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.authorized' || event === 'order.paid') {
      const orderId = payload.payment ? payload.payment.entity.order_id : (payload.order ? payload.order.entity.id : null);
      const paymentId = payload.payment ? payload.payment.entity.id : null;

      if (orderId) {
        const existingPayment = await Payment.findOne({ razorpayOrderId: orderId });
        if (existingPayment && existingPayment.status !== 'PAID') {
          existingPayment.status = 'PAID';
          if (paymentId) existingPayment.razorpayPaymentId = paymentId;
          existingPayment.paidAt = new Date();
          await existingPayment.save();

          await Booking.findByIdAndUpdate(existingPayment.booking, {
            paymentStatus: 'PAID',
            bookingStatus: 'CONFIRMED'
          });
        }
      }
    } else if (event === 'payment.failed') {
      const orderId = payload.payment ? payload.payment.entity.order_id : null;
      if (orderId) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: orderId },
          { status: 'FAILED' }
        );
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/booking/:bookingId
const getPaymentByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const payment = await Payment.findOne({ booking: bookingId }).populate('user', 'name email');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'No payment record found for this booking' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKey,
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentByBooking
};

