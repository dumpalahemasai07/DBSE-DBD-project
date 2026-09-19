const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Booking ID, rating, and comment are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to review this booking' });
    }

    if (booking.bookingStatus !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Reviews can only be submitted for completed services' });
    }

    const firstItem = booking.items[0];
    if (!firstItem || !firstItem.service) {
      return res.status(400).json({ success: false, error: 'Service details not found in booking' });
    }

    const review = await Review.create({
      service: firstItem.service,
      user: req.user._id,
      provider: booking.provider,
      booking: bookingId,
      rating: Number(rating),
      comment
    });

    // Update service rating and review count
    const reviews = await Review.find({ service: firstItem.service });
    const avgRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1);
    
    await Service.findByIdAndUpdate(firstItem.service, {
      rating: Number(avgRating),
      reviewCount: reviews.length
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'You have already reviewed this booking' });
    }
    next(error);
  }
};

const getServiceReviews = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const reviews = await Review.find({ service: serviceId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getServiceReviews
};
