const express = require('express');
const router = express.Router();
const paystackController = require('../controllers/paystackController');

router.get('/banks', paystackController.getBanks);
router.post('/verify-account', paystackController.verifyBankAccount);

module.exports = router;
