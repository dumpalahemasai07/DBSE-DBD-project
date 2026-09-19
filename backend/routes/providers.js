const express = require('express');
const router = express.Router();
const { getProviders, getRecommendedProviders, getProviderById } = require('../controllers/providerController');

router.get('/', getProviders);
router.get('/recommend', getRecommendedProviders);
router.get('/:id', getProviderById);

module.exports = router;
