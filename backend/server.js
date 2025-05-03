const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

// Routes
const authRoutes = require('./routes/authRoutes');
const groupOwnerRoutes = require('./routes/groupOwnerRoutes');
const groupRoutes = require('./routes/grouproutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paystackWebhookRoutes = require('./routes/paystackWebhookRoutes');
const transactionRoutes = require('./routes/transactionsRoutes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// CORS Configuration - should come before other middleware
app.use(cors({
  origin: ['https://www.subchatpro.com', 'http://localhost:3000'], // Added localhost for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'], // Added paystack header
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Handle preflight requests
app.options('*', cors());

// Middleware for parsing normal JSON
app.use(express.json()); // This should be used for normal routes

// Use bodyParser to handle raw JSON for Paystack webhook
app.use('/api/subscribe/paystack/webhook', bodyParser.raw({ type: 'application/json' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groupowner', groupOwnerRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/subscribe/paystack/webhook', paystackWebhookRoutes); 
app.use('/api/transactions', transactionRoutes);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    // 🔥 Load and start renewal cron job AFTER successful DB connection
    require('./utils/renewalCron');

    // 🔥 Load and start payout cron job AFTER successful DB connection
    const payoutCronJob = require('./utils/dailyPayoutCron');
    payoutCronJob.start();
    console.log('✅ Daily payout cron job loaded and scheduled');

    app.listen(process.env.PORT || 5002, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5002}`); // Fixed template literal
    });
  })
  .catch((err) => console.error('❌ DB connection error:', err));