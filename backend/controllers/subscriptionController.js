const axios = require('axios');
const Subscription = require('../models/subscription');
const Payment = require('../models/payment');
const Group = require('../models/group');
const verifyPaystackPayment = require('../utils/verifyPaystackPayment');
const sendEmail = require('../utils/sendEmail'); // Adjust path as needed
const { initiateRenewalPayment } = require('../utils/paymentUtils');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

function calculateExpiryDate() {
  const now = new Date();
  now.setMonth(now.getMonth() + 1); // 1-month duration
  return now;
}

// Initialize payment
exports.initializePayment = async (req, res) => {
  const {
    fullName,
    email,
    phone,
    groupId,
    amount,
    telegramUsername,
    channel = 'telegram',
    paymentType = 'initial',
    subscriptionId // only passed for renewals
  } = req.body;

  console.log("🛎️ Received payload for initialization:", {
    fullName,
    email,
    phone,
    groupId,
    amount,
    telegramUsername,
    channel,
    paymentType,
    subscriptionId
  });

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      message: 'Invalid amount. Please provide a valid amount greater than zero.'
    });
  }

  const amountInKobo = amount * 100;
  console.log("💰 Converted amount in kobo:", amountInKobo);

  try {
    const metadata = {
      fullName,
      phone,
      groupId,
      telegramUsername,
      channel,
      paymentType
    };

    if (paymentType === 'renewal' && subscriptionId) {
      metadata.subscriptionId = subscriptionId;
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo,
        metadata
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Paystack response:", response.data);

    res.status(200).json({
      authorization_url: response.data.data.authorization_url
    });
  } catch (err) {
    console.error(
      '❌ Error initializing payment with Paystack:',
      err.response ? err.response.data : err.message
    );

    res.status(500).json({
      message: 'Error initializing payment, please try again later'
    });
  }
};


// Verify payment and create subscription
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const paymentDetails = await verifyPaystackPayment(reference);

    if (paymentDetails.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const metadata = paymentDetails.metadata;
    const existing = await Subscription.findOne({ paystackRef: reference });

    if (!existing) {
      const newSubscription = new Subscription({
        name: metadata.fullName, // ✅ fixed
        email: paymentDetails.customer.email,
        phone: metadata.phone,
        groupId: metadata.groupId,
        paystackRef: reference,
        status: 'active',
        amountPaid: paymentDetails.amount / 100,
        expiresAt: calculateExpiryDate()
      });
      await newSubscription.save();
    }

    res.status(200).json({ message: 'Payment verified and subscription recorded' });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// Handle Paystack webhook
exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      const exists = await Subscription.findOne({ paystackRef: reference });
      if (!exists) {
        const { metadata } = data;

        const newSubscription = new Subscription({
          name: metadata.fullName, // ✅ fixed
          email: data.customer.email,
          phone: metadata.phone,
          groupId: metadata.groupId,
          paystackRef: reference,
          status: 'active',
          amountPaid: data.amount / 100,
          expiresAt: calculateExpiryDate()
        });
        await newSubscription.save();
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handling failed:', err);
    res.sendStatus(500);
  }
};

// admin override to foirce expire as backup for samuel

exports.forceExpireSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await Subscription.findById(subscriptionId)
      .populate('groupId');

    if (!subscription?.groupId) {
      throw new Error('Subscription or group not found');
    }

    // Get raw and kobo amount
    const amountInNaira = subscription.groupId.subscriptionPrice;
    const amountInKobo = amountInNaira * 100;

    // Expire the subscription
    subscription.expiresAt = new Date();
    subscription.status = 'expired';
    await subscription.save();

    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amountInNaira);

    // Send email with renewal link
    await sendEmail(
      subscription.subscriberEmail,
      `Subscription Expired: ${subscription.groupId.groupName}`,
      `Your ${subscription.groupId.groupName} subscription (${formattedAmount}) has expired.`,
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>Subscription Expired</h2>
        <p>Dear ${subscription.subscriberName},</p>
        <p>Your <strong>${subscription.groupId.groupName}</strong> subscription has expired.</p>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <a href="${process.env.FRONTEND_URL}/renew/${subscription._id}"
             style="background: #0066cc; color: white; padding: 10px 20px; display: inline-block; text-decoration: none;">
            Renew Now
          </a>
        </div>
      </div>
      `
    );

    res.json({ 
      success: true,
      amount: {
        in_naira: amountInNaira,
        formatted: formattedAmount,
        in_kobo: amountInKobo
      }
    });

  } catch (err) {
    console.error('Force expiration failed:', err);
    res.status(500).json({ 
      error: 'Failed to process expiration',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};





// controllers/subscriptionController.js
exports.getRenewalDetails = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId)
      .populate({
        path: 'groupId',
        select: 'groupName subscriptionPrice currency'
      });

    if (!subscription || !subscription.groupId) {
      return res.status(404).json({ 
        success: false,
        error: 'Subscription or associated group not found' 
      });
    }

    // Return amount in Naira (as stored in DB)
    res.json({
      success: true,
      data: {
        subscriberEmail: subscription.subscriberEmail,
        groupName: subscription.groupId.groupName,
        amount: subscription.groupId.subscriptionPrice, // In Naira (100.00)
        currency: subscription.groupId.currency || 'NGN',
        expiresAt: subscription.expiresAt
      }
    });

  } catch (error) {
    console.error('Error fetching renewal details:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};


