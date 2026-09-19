const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  comment: { type: String, required: true },
  images: [{ type: String }],
  isVerifiedBooking: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true }
}, { timestamps: true });

// Unique index to prevent duplicate reviews per booking
reviewSchema.index({ booking: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
