const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  rating: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 0 },
  startingPrice: { type: Number, required: true },
  duration: { type: String, default: '60 mins' },
  isActive: { type: Boolean, default: true },
  features: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
