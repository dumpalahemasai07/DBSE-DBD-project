const mongoose = require('mongoose');

const bookingItemSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  name: { type: String, required: true },
  packageName: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true }
});

const addressSnapshotSchema = new mongoose.Schema({
  tag: String,
  house: String,
  street: String,
  area: String,
  city: String,
  state: String,
  pincode: String
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', index: true },
  items: [bookingItemSchema],
  addressSnapshot: addressSnapshotSchema,
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  platformFee: { type: Number, default: 49 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], 
    default: 'PENDING' 
  },
  bookingStatus: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'PROVIDER_ASSIGNED', 'PROVIDER_ON_THE_WAY', 'SERVICE_STARTED', 'COMPLETED', 'CANCELLED'], 
    default: 'CONFIRMED' 
  },
  customerNotes: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: String, default: '' },
  cancelledAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
