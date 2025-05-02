const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

// Log incoming requests to check if they hit the backend
router.post('/register', (req, res, next) => {
  console.log('Register route hit');
  next();
}, authController.register);

router.post('/login', (req, res, next) => {
  console.log('Login route hit');
  next();
}, authController.login);

router.post('/forgot-password', (req, res, next) => {
  console.log('Forgot password route hit');
  next();
}, authController.requestPasswordReset);

// Log incoming requests for password reset
router.post('/reset-password/:token', (req, res, next) => {
  console.log('Reset Password route hit');
  next();
}, authController.resetPassword );

// Log incoming requests for email verification
router.get('/verify-email', (req, res, next) => {
  console.log('Verify Email route hit');
  next();
}, authController.verifyEmail);

router.post('/resend-verification', authController.resendVerificationEmail);

module.exports = router;
