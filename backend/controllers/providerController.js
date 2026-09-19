const Provider = require('../models/Provider');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

const getProviders = async (req, res, next) => {
  try {
    const { category, service, location } = req.query;
    let query = { isAvailable: true };

    if (category) query.serviceCategories = category;
    if (service) query.services = service;
    if (location) query.serviceAreas = { $regex: new RegExp(location, 'i') };

    const providers = await Provider.find(query)
      .populate('user', 'name email phone profileImage')
      .populate('services', 'name category')
      .sort({ rating: -1, completedJobs: -1 });

    res.json({ success: true, data: providers });
  } catch (error) {
    next(error);
  }
};

const getRecommendedProviders = async (req, res, next) => {
  try {
    const { serviceId, categoryId, location, date, timeSlot } = req.query;

    let query = { verificationStatus: 'VERIFIED' };

    const providers = await Provider.find(query)
      .populate('user', 'name email phone profileImage')
      .populate('services', 'name');

    // Check availability against existing bookings at requested date and time
    let bookedProviderIds = [];
    if (date && timeSlot) {
      const activeBookings = await Booking.find({
        scheduledDate: date,
        scheduledTime: timeSlot,
        bookingStatus: { $nin: ['CANCELLED'] },
        provider: { $ne: null }
      });
      bookedProviderIds = activeBookings.map(b => b.provider ? b.provider.toString() : '');
    }

    // Best Match Algorithm Calculation
    const scoredProviders = providers.map(p => {
      const pObj = p.toObject();

      const ratingScore = ((p.rating || 4.5) / 5.0) * 30; // Max 30 points
      const jobsScore = Math.min((p.completedJobs || 0) / 100, 1) * 20; // Max 20 points
      
      const hasService = serviceId && p.services && p.services.some(s => s._id.toString() === serviceId.toString());
      const expertiseScore = hasService ? 20 : 12; // Max 20 points

      const isBooked = bookedProviderIds.includes(p._id.toString());
      const isAvailable = p.isAvailable && !isBooked;
      const availabilityScore = isAvailable ? 15 : 0; // Max 15 points

      const locationMatch = location && p.serviceAreas && p.serviceAreas.some(area => area.toLowerCase().includes(location.toLowerCase()));
      const locationScore = locationMatch ? 10 : 5; // Max 10 points

      const reliabilityScore = 5; // Base reliability

      const totalScore = Number((ratingScore + jobsScore + expertiseScore + availabilityScore + locationScore + reliabilityScore).toFixed(2));

      pObj.score = totalScore;
      pObj.isAvailableForSlot = isAvailable;
      return pObj;
    });

    // Sort by score descending
    scoredProviders.sort((a, b) => b.score - a.score);

    const bestMatch = scoredProviders.length > 0 ? scoredProviders[0] : null;
    const topProfessionals = scoredProviders;

    res.json({
      success: true,
      data: {
        bestMatch,
        topProfessionals,
        total: scoredProviders.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProviderById = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('user', 'name email phone profileImage')
      .populate('services', 'name rating startingPrice imageUrl')
      .populate('serviceCategories', 'name icon');

    if (!provider) return res.status(404).json({ success: false, error: 'Provider not found' });

    // Fetch customer reviews for this provider
    const reviews = await Review.find({ provider: provider._id })
      .populate('user', 'name profileImage')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const result = provider.toObject();
    result.reviews = reviews;

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProviders,
  getRecommendedProviders,
  getProviderById
};
