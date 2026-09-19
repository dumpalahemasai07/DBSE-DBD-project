const Coupon = require('../models/Coupon');

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ isActive: true });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, error: 'Invalid or expired coupon code' });

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ success: false, error: 'Coupon has expired' });
    }

    if (amount < coupon.minimumOrder) {
      return res.status(400).json({ success: false, error: `Minimum order amount of ₹${coupon.minimumOrder} required for this coupon` });
    }

    let discount = 0;
    if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENTAGE') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maximumDiscount > 0 && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount: Math.round(discount),
        description: coupon.description
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  validateCoupon
};
