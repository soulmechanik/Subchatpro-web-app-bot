const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payer Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\d\+\-\(\) ]+$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },

  // References
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true
  },

  // Payment Processing
  paystackRef: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100, // Minimum 1 Naira (100 kobo)
    get: v => (v / 100).toFixed(2), // Convert kobo to Naira when retrieving
    set: v => Math.round(v * 100) // Convert Naira to kobo when saving
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'GHS'],
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'abandoned'],
    default: 'pending',
    index: true
  },
  channel: {
    type: String,
    enum: ['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'apple_pay', 'google_pay'],
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },

  // Context & Metadata
  paymentContext: {
    type: String,
    enum: ['initial', 'renewal', 'manual_topup', 'admin', 'upgrade'],
    required: true
  },
  linkedRenewalChain: [{
    paymentRef: { type: String, required: true },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },

  // Timestamps
  paidAt: {
    type: Date,
    required: function() {
      return this.status === 'success';
    }
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true
  },
  toObject: {
    virtuals: true,
    getters: true
  }
});

// Indexes
paymentSchema.index({ groupId: 1, status: 1 });
paymentSchema.index({ email: 1, status: 1 });
paymentSchema.index({ subscriptionId: 1, paidAt: -1 });
paymentSchema.index({ paystackRef: 1, status: 1 });

// Virtual for formatted amount display
paymentSchema.virtual('amountDisplay').get(function() {
  return `${this.currency} ${(this.amount / 100).toFixed(2)}`;
});

// Pre-save hook for validation
paymentSchema.pre('save', function(next) {
  if (this.status === 'success' && !this.paidAt) {
    this.paidAt = new Date();
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;