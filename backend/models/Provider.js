const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  profileImage: { type: String, default: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80' },
  bio: { type: String, default: 'Certified & Background Verified Service Professional.' },
  experience: { type: Number, default: 5 }, // Years of experience
  skills: [{ type: String }],
  serviceCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  rating: { type: Number, default: 4.8, min: 1, max: 5 },
  reviewCount: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  verificationStatus: { 
    type: String, 
    enum: ['PENDING', 'VERIFIED', 'REJECTED'], 
    default: 'VERIFIED' 
  },
  isAvailable: { type: Boolean, default: true },
  serviceAreas: [{ type: String }] // e.g. ['Jubilee Hills', 'Banjara Hills', 'Gachibowli']
}, { timestamps: true });

module.exports = mongoose.model('Provider', providerSchema);
