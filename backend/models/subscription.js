const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Subscriber Information
  subscriberName: {
    type: String,
    required: true,
    trim: true
  },
  subscriberEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subscriberPhone: {
    type: String,
    trim: true
  },
  telegramUsername: {
    type: String,
    required: true,
    trim: true
  },

  // Group Reference
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },

  // Payment Reference
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  paystackRef: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Subscription Dates
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['active', 'expired', 'pending', 'cancelled'],
    default: 'active',
    index: true
  },
  paymentType: {
    type: String,
    enum: ['initial', 'renewal'],
    default: 'initial'
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  autoRenew: {
    type: Boolean,
    default: false
  },

  // Admin Flags
  wasManuallyAdded: {
    type: Boolean,
    default: false
  },

  // Notification Logs
  notificationLog: [{
    sentAt: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['3_day_reminder', '2_day_reminder', '1_day_reminder', 'expired'],
      required: true
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'telegram', 'both'],
      required: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to convert telegramUsername to lowercase before saving
subscriptionSchema.pre('save', function (next) {
  if (this.telegramUsername) {
    this.telegramUsername = this.telegramUsername.toLowerCase();
  }
  next();
});

// Indexes for faster queries
subscriptionSchema.index({ groupId: 1, status: 1 });
subscriptionSchema.index({ expiresAt: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
