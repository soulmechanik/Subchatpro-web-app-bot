
// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// --- 🛡️ CORS Configuration ---

app.use(cors({
  origin: 'https://www.subchatpro.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['set-cookie'] // ✅ important for cookies sometimes
}));

// --- 🍪 Cookie Parser (MUST be early) ---
app.use(cookieParser());

// --- 📝 Body Parsers ---

// Parse normal JSON payloads
app.use(express.json());

// Special body parser for Paystack webhook
app.use('/api/subscribe/paystack/webhook', bodyParser.raw({ type: 'application/json' }));

// --- 📦 API Routes ---
const authRoutes = require('./routes/authRoutes');
const groupOwnerRoutes = require('./routes/groupOwnerRoutes');
const groupRoutes = require('./routes/grouproutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paystackWebhookRoutes = require('./routes/paystackWebhookRoutes');
const transactionRoutes = require('./routes/transactionsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/groupowner', groupOwnerRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/subscribe/paystack/webhook', paystackWebhookRoutes);
app.use('/api/transactions', transactionRoutes);

// --- 🌍 MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5002, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5002}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
