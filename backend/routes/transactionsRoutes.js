const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTransactions } = require('../controllers/transactionsController');

// GET /api/transactions
router.get('/', protect, getTransactions);

module.exports = router;
