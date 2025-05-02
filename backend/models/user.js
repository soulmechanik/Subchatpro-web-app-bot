const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Constants for token expiration (in milliseconds)
const VERIFICATION_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 mins
const PASSWORD_RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please use a valid email address'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [128, 'Password must be less than 128 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'GroupOwner', 'Subscriber'],
    default: 'Subscriber'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  onboarded: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verificationToken: {
    type: String,
    index: true
  },
  verificationTokenExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String,
    index: true
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// ====================== MIDDLEWARE ======================
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ====================== INSTANCE METHODS ======================
userSchema.methods = {
  // Compare password with hashed version
  matchPassword: async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  },

  // Generate email verification token
  generateVerificationToken: function() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    this.verificationToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
      
    this.verificationTokenExpires = Date.now() + VERIFICATION_TOKEN_EXPIRY;
    return rawToken; // Send this to user's email
  },

  // Generate password reset token
  generateResetPasswordToken: function() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
      
    this.resetPasswordExpires = Date.now() + PASSWORD_RESET_TOKEN_EXPIRY;
    return rawToken; // Send this to user's email
  },

  // Check if verification token is expired
  isVerificationTokenExpired: function() {
    return this.verificationTokenExpires < Date.now();
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
