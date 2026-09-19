const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');

const getBookings = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'provider' || req.user.role === 'professional') {
      const provDoc = await Provider.findOne({ user: req.user._id });
      if (provDoc) {
        query.provider = provDoc._id;
      } else {
        query.provider = req.user._id;
      }
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone')
      .populate('provider', 'name phone email rating');

    // Format output for frontend compatibility
    const formatted = bookings.map(b => {
      const obj = b.toObject();
      obj.user = b.customer;
      obj.professional = b.provider;
      obj.date = b.scheduledDate;
      obj.timeSlot = b.scheduledTime;
      obj.address = b.addressSnapshot ? `${b.addressSnapshot.house}, ${b.addressSnapshot.street}, ${b.addressSnapshot.area}, ${b.addressSnapshot.city} - ${b.addressSnapshot.pincode}` : 'Hyderabad';
      obj.grandTotal = b.totalAmount;
      obj.status = b.bookingStatus;
      obj.items = b.items.map(i => ({
        variantTitle: i.packageName || i.name,
        price: i.unitPrice,
        quantity: i.quantity
      }));
      return obj;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name phone email');

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found in database' });

    const obj = booking.toObject();
    obj.user = booking.customer;
    obj.professional = booking.provider;
    obj.date = booking.scheduledDate;
    obj.timeSlot = booking.scheduledTime;
    obj.address = booking.addressSnapshot ? `${booking.addressSnapshot.house}, ${booking.addressSnapshot.street}, ${booking.addressSnapshot.area}` : 'Hyderabad';
    obj.grandTotal = booking.totalAmount;
    obj.status = booking.bookingStatus;

    res.json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
};

const VALID_24H_SLOTS = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, '0');
  VALID_24H_SLOTS.push(`${hh}:00`, `${hh}:30`);
}

function validateBookingSchedule(date, timeSlot) {
  if (!date || !timeSlot) {
    return { valid: false, error: 'Date and time slot are required' };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD' };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (date < todayStr) {
    return { valid: false, error: 'Cannot book a date in the past' };
  }

  const is24hFormat = /^\d{2}:\d{2}$/.test(timeSlot);
  if (is24hFormat) {
    if (!VALID_24H_SLOTS.includes(timeSlot)) {
      return { valid: false, error: 'Invalid 24-hour time slot. Must be between 00:00 and 23:30 in 30-minute intervals.' };
    }

    if (date === todayStr) {
      const currentHH = now.getHours().toString().padStart(2, '0');
      const currentMM = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHH}:${currentMM}`;

      if (timeSlot <= currentTimeStr) {
        return { valid: false, error: `Time slot ${timeSlot} has already passed for today. Please select a future time slot.` };
      }
    }
  }

  return { valid: true };
}

const createBooking = async (req, res, next) => {
  try {
    const { items, cartTotal, consultationTotal, grandTotal, date, timeSlot, address, paymentMethod } = req.body;

    const validation = validateBookingSchedule(date, timeSlot);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    // Check duplicate active booking conflict
    const existingConflict = await Booking.findOne({
      customer: req.user._id,
      scheduledDate: date,
      scheduledTime: timeSlot,
      bookingStatus: { $nin: ['CANCELLED'] }
    });

    if (existingConflict) {
      return res.status(400).json({
        success: false,
        error: `You already have an active booking (#${existingConflict.bookingNumber}) scheduled for ${date} at ${timeSlot}.`
      });
    }

    const bNumber = `HS${Date.now().toString().slice(-8)}`;

    // Auto-assign available provider
    const availableProviders = await Provider.find({ isAvailable: true });
    const selectedProvider = availableProviders.length > 0 ? availableProviders[Math.floor(Math.random() * availableProviders.length)] : null;

    const formattedItems = (items || []).map(i => ({
      service: i.serviceId || i.service || null,
      name: i.serviceName || 'Home Service',
      packageName: i.variantTitle || 'Standard Package',
      unitPrice: i.price || 499,
      quantity: i.quantity || 1,
      totalPrice: (i.price || 499) * (i.quantity || 1)
    }));

    const method = paymentMethod === 'COD' || paymentMethod === 'CASH' ? 'CASH' : 'RAZORPAY';

    const booking = await Booking.create({
      bookingNumber: bNumber,
      customer: req.user._id,
      provider: selectedProvider ? selectedProvider._id : null,
      items: formattedItems,
      addressSnapshot: {
        tag: 'Home',
        house: address || 'Doorstep Address',
        street: 'Main Road',
        area: 'Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033'
      },
      scheduledDate: date,
      scheduledTime: timeSlot,
      subtotal: cartTotal || 499,
      discount: 0,
      tax: 0,
      platformFee: 49,
      totalAmount: grandTotal || 548,
      paymentStatus: 'PENDING',
      bookingStatus: selectedProvider ? 'PROVIDER_ASSIGNED' : 'CONFIRMED'
    });

    // Create Notification
    await Notification.create({
      user: req.user._id,
      title: `Booking #${bNumber} Confirmed`,
      message: `Your service booking for ${date} (${timeSlot}) has been placed successfully.`,
      type: 'BOOKING',
      booking: booking._id
    });

    // Create Initial Payment Record in PENDING/CREATED status
    await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: grandTotal || 548,
      currency: 'INR',
      method: method,
      transactionId: `TXN_${Date.now()}`,
      status: method === 'CASH' ? 'PENDING' : 'CREATED'
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, professionalId } = req.body;
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    if (req.user.role === 'admin') {
      if (status) booking.bookingStatus = status;
      if (professionalId !== undefined) booking.provider = professionalId;
    } else if (req.user.role === 'provider' || req.user.role === 'professional') {
      const provDoc = await Provider.findOne({ user: req.user._id });
      if (provDoc && booking.provider && booking.provider.toString() === provDoc._id.toString()) {
        if (status) booking.bookingStatus = status;
      } else {
        if (status) booking.bookingStatus = status;
      }
    } else {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this booking' });
    }

    await booking.save();
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    let booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    if (req.user.role === 'customer' && booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to cancel this booking' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cannot cancel a booking that is already CANCELLED' });
    }

    if (booking.bookingStatus === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Cannot cancel a booking that is COMPLETED' });
    }

    booking.bookingStatus = 'CANCELLED';
    booking.cancelledBy = req.user.role || 'customer';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.cancellationReason || req.body.reason || 'Customer requested cancellation';

    // Release provider if assigned
    if (booking.provider) {
      await Provider.findByIdAndUpdate(booking.provider, { isAvailable: true });
    }

    // Process refund handling for paid bookings
    if (booking.paymentStatus === 'PAID') {
      booking.paymentStatus = 'REFUNDED';
      await Payment.findOneAndUpdate(
        { booking: booking._id },
        { status: 'REFUNDED', refundedAt: new Date() }
      );
    }

    await booking.save();

    // Create Notification
    await Notification.create({
      user: booking.customer,
      title: `Booking #${booking.bookingNumber} Cancelled`,
      message: `Your booking for ${booking.scheduledDate} (${booking.scheduledTime}) has been cancelled successfully.`,
      type: 'BOOKING',
      booking: booking._id
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleBooking = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.body;
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    if (req.user.role === 'customer' && booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to reschedule this booking' });
    }

    const validation = validateBookingSchedule(date, timeSlot);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    booking.scheduledDate = date || booking.scheduledDate;
    booking.scheduledTime = timeSlot || booking.scheduledTime;
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const getRecentBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('provider', 'name rating profileImage phone')
      .populate('items.service', 'name startingPrice imageUrl category variants');

    const Service = require('../models/Service');
    const formatted = [];

    for (let b of bookings) {
      const obj = b.toObject();
      const item = obj.items && obj.items[0];
      if (!item) continue;

      let serviceDoc = item.service;

      // 1. If item.service was not populated object, try findById if valid ObjectId
      if (!serviceDoc || !serviceDoc._id) {
        if (item.service && mongoose.Types.ObjectId.isValid(item.service)) {
          serviceDoc = await Service.findById(item.service);
        }
      }

      // 2. Try matching by item.name
      if (!serviceDoc || !serviceDoc._id) {
        if (item.name && item.name !== 'Home Service') {
          serviceDoc = await Service.findOne({ name: new RegExp(item.name, 'i') });
        }
      }

      // 3. Try matching by b.serviceId if stored on booking root
      if ((!serviceDoc || !serviceDoc._id) && b.serviceId && mongoose.Types.ObjectId.isValid(b.serviceId)) {
        serviceDoc = await Service.findById(b.serviceId);
      }

      // If service truly no longer exists in MongoDB, do not show in Recent Services UI
      if (!serviceDoc || !serviceDoc._id) {
        continue;
      }

      obj.user = b.customer;
      obj.professional = b.provider;
      obj.date = b.scheduledDate;
      obj.timeSlot = b.scheduledTime;
      obj.grandTotal = b.totalAmount;
      obj.status = b.bookingStatus;

      // Explicit resolved fields for frontend consumption
      obj.serviceId = serviceDoc._id.toString();
      obj.serviceName = serviceDoc.name;
      obj.packageName = item.packageName || (serviceDoc.variants && serviceDoc.variants[0] ? serviceDoc.variants[0].title : '');

      formatted.push(obj);
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
  getRecentBookings
};
