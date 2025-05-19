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
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",  // for local development
  "https://www.subchatpro.com",  // production frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS not allowed for origin: ${origin}`);
      callback(new Error("CORS not allowed"), false);
    }
  },
  credentials: true, // Allow cookies (important for login)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['set-cookie']
}));

// --- 🍪 Cookie Parser (MUST be early) ---
app.use(cookieParser());

// --- 📝 Body Parsers ---
// Paystack raw webhook first
app.use('/api/subscribe/paystack/webhook', bodyParser.raw({ type: 'application/json' }));

// General body parser after
app.use(express.json());

// --- 📦 API Routes ---
const authRoutes = require('./routes/authRoutes');
const groupOwnerRoutes = require('./routes/groupOwnerRoutes');
const groupRoutes = require('./routes/grouproutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paystackWebhookRoutes = require('./routes/paystackWebhookRoutes');
const transactionRoutes = require('./routes/transactionsRoutes');
const paystackRoutes = require('./routes/paystackRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/groupowner', groupOwnerRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/subscribe/paystack/webhook', paystackWebhookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/paystack', paystackRoutes); 
// --- 🌍 Root Endpoint ---
app.get("/", (req, res) => {
  res.send("SubChatPro Authentication API is running...");
});

require('./utils/dailyPayoutCron');

// --- 🌍 MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5002, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5002}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
