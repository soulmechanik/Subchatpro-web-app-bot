const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  ownerProfileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GroupOwnerProfile', 
    required: true 
  },
  groupName: { 
    type: String, 
    required: true 
  },
  telegramGroupLink: { 
    type: String, 
    required: true 
  },
  telegramGroupId: { // 👈 NEW FIELD
    type: String,
    required: true
  },
  description: { 
    type: String 
  },
  category: {
    type: String,
    enum: ['technology', 'entertainment', 'business', 'education', 'health', 'lifestyle', 'sports', 'other'],
    default: 'other'
  },
  subscriptionFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'biannual', 'annual'],
    required: true,
  },
  subscriptionPrice: {
    type: Number,
    required: true,
  },
  currency: { 
    type: String, 
    default: 'NGN' 
  },
  shareLink: {
    type: String,
    required: true,
    unique: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
