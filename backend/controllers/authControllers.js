const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { serialize } = require("cookie");


const dotenv = require('dotenv');
dotenv.config();
const sendEmail = require('../utils/sendEmail')
const { isRateLimited } = require('../utils/rateLimiter');


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Register Controller


exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('\n===== 📝 Registration Attempt =====');
    console.log('Incoming Email:', email);
    console.log('Incoming Role:', role);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        message: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Email already exists:', email);
      return res.status(409).json({
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Create user and generate verification token
    const user = new User({ email, password, role });
    const rawVerificationToken = user.generateVerificationToken();
    console.log('✅ Raw Verification Token:', rawVerificationToken);
    console.log('🔐 Hashed Token Saved to DB:', user.verificationToken);
    console.log('🕒 Token Expiry Set to:', user.verificationTokenExpires);

    await user.save();
    console.log('✅ User saved to database with ID:', user._id);

    // Generate verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${rawVerificationToken}&id=${user._id}`;

    console.log('📧 Verification URL Sent:', verificationUrl);

    // Enhanced email content
    const subject = 'Verify Your Email - SubChat';
    const text = `Please verify your email by clicking this link: ${verificationUrl}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          background-color: #4f46e5;
          border-radius: 8px 8px 0 0;
          color: white;
        }
        .content {
          padding: 30px;
          background-color: #f9fafb;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4f46e5;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .code {
          background-color: #e5e7eb;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to SubChat!</h1>
      </div>
      <div class="content">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering with SubChat. To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        
        <p>This verification link will expire in 24 hours.</p>
        
        <div class="footer">
          <p>If you didn't create an account with SubChat, please ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} SubChat. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await sendEmail(user.email, subject, text, html);

    console.log('✅ Verification email sent');
    console.log('======================================\n');

    res.status(201).json({
      success: true,
      message: 'Verification email sent',
      userId: user._id
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      code: 'SERVER_ERROR'
    });
  }
};





exports.verifyEmail = async (req, res) => {
  try {
    const { token, id } = req.query;

    console.log('\n===== 🚀 Incoming Email Verification Attempt =====');
    console.log('🌐 Raw token from URL query:', token);
    console.log('🆔 User ID from URL query:', id);

    if (!token || !id) {
      console.log('❌ Missing token or ID in query params');
      return res.status(400).json({
        success: false,
        code: 'MISSING_TOKEN_OR_ID',
        message: 'Verification link is invalid (missing token or user ID)',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      console.log('❌ No user found with this ID.');
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'No account found with this verification link',
      });
    }

    console.log('🔍 User found:', user.email);

    if (user.isVerified) {
      console.log('ℹ️ User already verified');
      return res.status(400).json({
        success: false,
        code: 'ALREADY_VERIFIED',
        message: 'Email is already verified',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    console.log('🧮 Hashed token from query:', hashedToken);
    console.log('📦 Stored hashed token on user:', user.verificationToken);
    console.log('🕒 Token expiry in DB:', user.verificationTokenExpires);
    console.log('🕐 Current time:', new Date());
    console.log('⌛ Is token expired?:', user.isVerificationTokenExpired());

    if (
      user.verificationToken !== hashedToken ||
      user.isVerificationTokenExpired()
    ) {
      console.log('❌ Token mismatch or expired.');
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Verification link is invalid or has expired',
      });
    }

    user.isVerified = true;
    user.verifiedAt = new Date();
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    console.log('✅ Email successfully verified!');
    console.log('==================================================\n');

    return res.status(200).json({
      success: true,
      message: 'Email successfully verified',
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'An error occurred during email verification',
    });
  }
};




exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    // Optional: Rate limiting
    const rateLimited = await isRateLimited(email);
    if (rateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please register first.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. Please log in.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expirationTime = Date.now() + 10 * 60 * 1000;

    user.verificationToken = hashedToken;
    user.verificationTokenExpires = new Date(expirationTime);
    await user.save();

    // Prepare email data
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&id=${user._id}`;
    const subject = "Verify Your Email";
    const text = `Hello, \n\nPlease verify your email by clicking the link below:\n${verificationUrl}\n\nThis link will expire in 10 minutes.\n\nThank you,\nSubChat Team`;

    // Send the email using your existing sendEmail function
    await sendEmail(user.email, subject, text);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Error in resending verification email:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resending the verification email.'
    });
  }
};



exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("🔹 [1/6] Login Attempt Initiated - Email:", email);

  // Validate if email and password are provided
  if (!email || !password) {
    console.log("❌ [1/6] Validation Failed - Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  console.log("🔍 [2/6] Searching User in Database...");
  
  // Find the user by email (include password, role, onboarding, and isVerified fields)
  const user = await User.findOne({ email }).select("+password +role +onboarding +isVerified");

  if (!user) {
    console.log("❌ [2/6] User Not Found - Email:", email);
    return res.status(400).json({ message: "User not found" });
  }

  console.log("✅ [2/6] User Found - Details:", {
    email: user.email,
    role: user.role,
    onboarding: user.onboarded,
    isVerified: user.isVerified
  });

  console.log("🔐 [3/6] Password Verification Initiated");
  
  // Compare password hashes
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(`🔐 [3/6] Password Match: ${isMatch ? "✅ Success" : "❌ Failed"}`);

  if (!isMatch) {
    console.log("❌ [3/6] Authentication Failed - Incorrect Password");
    return res.status(400).json({ message: "Incorrect password" });
  }

  console.log("🛠️ [4/6] Generating JWT Token...");
  
  // Generate a JWT token for the user
  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days expiration
  );

  console.log("🔑 [4/6] Token Generated Successfully");
  
  // Log the token for debugging
  console.log("🔑 [4/6] Token: ", token);

  // Serialize the token into a secure cookie
  const serialized = serialize('token', token, {
    httpOnly: true, // Prevent JavaScript access to cookie
    secure: 'true', // Only secure if in production environment
    sameSite: 'None', // Allow cross-origin requests
    path: '/', // Available for all routes
    maxAge: 60 * 60 * 24 * 7, // 7 days expiration
  });

  // Log if the cookie is set correctly
  console.log("🔑 [4/6] Setting Cookie - Cookie Header: ", serialized);

  // Set the cookie in the response header
  res.setHeader('Set-Cookie', serialized);

  console.log("🚀 [5/5] Login Successful - Sending Response");

  // Send a successful response with user data
  res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      onboarding: user.onboarded,
    },
  });
});







exports.getMe = async (req, res) => {
  try {
    // 🛑 FIRST: Check if token exists in cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // 🛡️ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔥 Now decoded contains { userId, role }
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);  // Send the user data back

  } catch (error) {
    console.error("💥 Error fetching user data:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
};


exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by the provided email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that email.' });
    }

    // Generate the reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct the reset URL for the frontend
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Make sure the email is valid
    if (!user.email) {
      return res.status(400).json({ message: 'No email associated with this user.' });
    }

    // Construct the email body in plain text format
    const emailText = `You requested a password reset.
    Click here to reset your password: ${resetURL}
    This link will expire in 1 hour.`;

    // Send the email using the sendEmail function
    await sendEmail(user.email, 'Password Reset Request', emailText);

    // Respond with a success message
    res.status(200).json({ message: 'Password reset email sent successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send reset email. Try again later.' });
  }
};



exports.resetPassword = async (req, res) => {
  const { token } = req.params;  // Token comes from the URL
  const { password, confirmPassword } = req.body;  // Passwords from the request body

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // Hash the token received from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by the reset token and ensure the token hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    // Update the user's password
    user.password = password;
    user.resetPasswordToken = undefined;  // Remove the reset token
    user.resetPasswordExpires = undefined;  // Remove expiration time
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Try again.' });
  }
};