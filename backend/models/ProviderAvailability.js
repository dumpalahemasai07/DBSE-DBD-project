const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  slot: { type: String, required: true }, // e.g. "10:00 AM - 12:00 PM"
  isBooked: { type: Boolean, default: false }
}, { _id: false });

const providerAvailabilitySchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
  date: { type: String, required: true }, // e.g. "2026-09-15"
  timeSlots: [timeSlotSchema],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

providerAvailabilitySchema.index({ provider: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ProviderAvailability', providerAvailabilitySchema);
