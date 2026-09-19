const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  razorpaySignature: { type: String },
  method: { 
    type: String, 
    enum: ['RAZORPAY', 'CARD', 'UPI', 'NET_BANKING', 'CASH', 'DEMO'], 
    default: 'RAZORPAY' 
  },
  transactionId: { type: String },
  status: { 
    type: String, 
    enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'COMPLETED'], 
    default: 'CREATED' 
  },
  paidAt: { type: Date },
  refundedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
