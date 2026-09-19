const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  duration: { type: String, required: true }, // e.g. '45 mins', '90 mins'
  includedItems: [{ type: String }],
  excludedItems: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
