const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Provider = require('../models/Provider');
const Payment = require('../models/Payment');

const getAdminStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const payments = await Payment.find({ status: { $in: ['PAID', 'COMPLETED'] } });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalPros = await User.countDocuments({ role: { $in: ['provider', 'professional'] } });
    const totalServices = await Service.countDocuments();

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalBookings,
        totalCustomers,
        totalPros,
        totalServices
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin', 'professional', 'provider'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const targetRole = role === 'professional' ? 'provider' : role;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.role = targetRole;
    await user.save();

    res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  updateUserRole
};
