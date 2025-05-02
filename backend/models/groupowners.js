const mongoose = require('mongoose');

const groupOwnerProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Ensures one profile per user
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  telegramUsername: { 
    type: String 
  },
  bankDetails: {
    accountHolderName: { 
      type: String, 
      required: true 
    },
    accountNumber: { 
      type: String, 
      required: true 
    },
    bankName: { 
      type: String, 
      required: true 
    }
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const GroupOwnerProfile = mongoose.model('GroupOwnerProfile', groupOwnerProfileSchema);
module.exports = GroupOwnerProfile;
