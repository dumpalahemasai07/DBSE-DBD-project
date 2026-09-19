const express = require('express');
const router = express.Router();
const { getAdminStats, updateUserRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);

module.exports = router;
