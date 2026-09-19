const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updateUserProfile,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getFavorites,
  addFavorite,
  removeFavorite,
  getUsers 
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

// Address Management
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Favorites Management
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:serviceId', protect, addFavorite);
router.delete('/favorites/:serviceId', protect, removeFavorite);

router.get('/users', protect, authorize('admin'), getUsers);

module.exports = router;

