// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');
const paymentUtils = require('../utils/paymentUtils');

// Existing routes
router.post('/initialize', subscriptionController.initializePayment);
router.get('/verify/:reference', subscriptionController.verifyPayment);
router.post('/:subscriptionId/force-expire', protect, subscriptionController.forceExpireSubscription);

// Renewal flow routes
router.get('/:subscriptionId/renewal-details', subscriptionController.getRenewalDetails);
router.post('/:subscriptionId/initialize-renewal', paymentUtils.initializeRenewalForFrontend);

module.exports = router;