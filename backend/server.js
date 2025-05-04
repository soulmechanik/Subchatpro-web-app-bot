const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

// Routes
const authRoutes = require('./routes/authRoutes'); // Auth Routes
const groupOwnerRoutes = require('./routes/groupOwnerRoutes'); // Group Owner Routes
const groupRoutes = require('./routes/grouproutes'); // Group Routes
const subscriptionRoutes = require('./routes/subscriptionRoutes'); // Subscription Routes
const paystackWebhookRoutes = require('./routes/paystackWebhookRoutes'); // Paystack Webhook Routes
const transactionRoutes = require('./routes/transactionsRoutes'); // Transaction Routes

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

// Middleware for parsing normal JSON
app.use(express.json()); // This should be used for normal routes

// Use bodyParser to handle raw JSON for Paystack webhook
app.use('/api/subscribe/paystack/webhook', bodyParser.raw({ type: 'application/json' }));

// Routes
app.use('/api/auth', authRoutes); // Auth Routes
app.use('/api/groupowner', groupOwnerRoutes); // Group Owner Routes
app.use('/api/groups', groupRoutes); // Group Routes
app.use('/api/subscribe', subscriptionRoutes); // Subscription Routes
app.use('/api/subscribe/paystack/webhook', paystackWebhookRoutes); 
app.use('/api/transactions', transactionRoutes); // Transaction Routes

// MongoDB Connection Test
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5002, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5002}`);
    });
  })
  .catch((err) => console.error('❌ DB connection error:', err));
