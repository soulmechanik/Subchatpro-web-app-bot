const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  groupOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOwnerProfile',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transferRef: {
    type: String,
    required: function () {
      return this.status === 'completed';
    }
  },
  note: {
    type: String
  },

  isPaidOut: {
    type: Boolean,
    default: false,
  },
  paystackTransferReference: {
    type: String,
  },
  
  requestedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }



});


const Payout = mongoose.model('Payout', payoutSchema);
module.exports = Payout;
