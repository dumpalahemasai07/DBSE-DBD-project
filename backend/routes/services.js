const express = require('express');
const router = express.Router();
const { 
  getServices, 
  getServiceById, 
  searchServices,
  getCategories,
  createService,
  updateService,
  deleteService 
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getServices)
  .post(protect, authorize('admin'), createService);

router.route('/search').get(searchServices);
router.route('/categories').get(getCategories);

router.route('/:id')
  .get(getServiceById)
  .put(protect, authorize('admin'), updateService)
  .delete(protect, authorize('admin'), deleteService);

module.exports = router;
