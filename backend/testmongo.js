const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// CORS Configuration
app.use(cors({
  origin: ['https://www.subchatpro.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Middleware for parsing normal JSON
app.use(express.json());

// Test server connection with no routes
app.listen(process.env.PORT || 5002, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5002}`);
});
