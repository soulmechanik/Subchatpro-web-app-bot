const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/authRoutes');
const groupOwnerRoutes = require('./routes/groupOwnerRoutes');
const groupRoutes = require('./routes/groupRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Use JSON parsing middleware
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/groupowner', groupOwnerRoutes);
app.use('/api/groups', groupRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    
    // Start the server
    app.listen(process.env.PORT || 5002, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5002}`);
    });
  })
  .catch((err) => console.error('❌ DB connection error:', err));
