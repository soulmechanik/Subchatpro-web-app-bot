const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTransactions, getPaymentStatus } = require('../controllers/transactionsController');

// ✅ GET /api/transactions - Protected Route
router.get('/', protect, getTransactions);

// ✅ POST /api/transactions/payment/status - Public Route (no protect needed)
router.post('/payment/status', getPaymentStatus);

module.exports = router;
