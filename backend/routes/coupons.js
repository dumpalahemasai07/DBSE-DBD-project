const express = require('express');
const router = express.Router();
const { getCoupons, validateCoupon } = require('../controllers/couponController');

router.get('/', getCoupons);
router.post('/validate', validateCoupon);

module.exports = router;
