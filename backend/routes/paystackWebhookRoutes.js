const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/paystackWebhookController');

router.post(
  '/', 
  express.raw({ type: 'application/json' }), 
  webhookController.handleWebhook
);




module.exports = router;