const axios = require('axios');
const Payment = require('../models/payment');
const Subscription = require('../models/subscription');

/**
 * Generate a unique Paystack reference
 */
const generateReference = () => `subchat-renewal-${Date.now().toString(36)}`;

/**
 * Initialize a renewal payment
 */
const initiateRenewalPayment = async (subscription, options = {}) => {
  if (!subscription?.groupId || !subscription.subscriberEmail) {
    throw new Error('Missing group or subscriber email');
  }

  const group = subscription.groupId;

  if (typeof group.subscriptionPrice !== 'number' || group.subscriptionPrice <= 0) {
    throw new Error('Invalid subscription price');
  }

  const amountInKobo = Math.round(group.subscriptionPrice * 100);
  const reference = generateReference();

  const existingPayment = await Payment.findOne({ paystackRef: reference });
  if (existingPayment) throw new Error(`Duplicate payment reference: ${reference}`);

  const callbackUrl = options.callbackUrl || `${process.env.FRONTEND_URL}/payment-callback/${subscription._id}`;

  const paystackPayload = {
    email: subscription.subscriberEmail,
    amount: amountInKobo,
    reference,
    metadata: {
      subscriptionId: subscription._id.toString(),
      groupId: group._id.toString(),
      originalAmountNaira: group.subscriptionPrice,
      paymentType: 'renewal',
      fullName: subscription.subscriberName,
      phone: subscription.subscriberPhone || '',
      initiatedAt: new Date().toISOString(),
      ...options.metadata
    },
    callback_url: callbackUrl
  };

  const headers = {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };

  const { data } = await axios.post('https://api.paystack.co/transaction/initialize', paystackPayload, { headers });

  if (!data?.status) throw new Error('Invalid response from Paystack');

  const payment = new Payment({
    name: subscription.subscriberName,
    email: subscription.subscriberEmail,
    phone: subscription.subscriberPhone || null,
    groupId: group._id,
    subscriptionId: subscription._id,
    paystackRef: reference,
    amount: group.subscriptionPrice,
    amountInKobo,
    currency: 'NGN',
    status: 'pending',
    channel: options.channel || 'bank',
    paymentContext: 'renewal',
    metadata: {
      ...options.metadata,
      paystackResponse: data.data
    }
  });

  await payment.save();

  return {
    success: true,
    paymentRecord: payment,
    paymentUrl: data.data.authorization_url,
    reference,
    amountInNaira: group.subscriptionPrice,
    amountInKobo
  };
};

/**
 * API: Initialize renewal from frontend
 */
const initializeRenewalForFrontend = async (req, res) => {
  const { subscriptionId } = req.params;
  if (!subscriptionId) {
    return res.status(400).json({ success: false, error: 'Subscription ID is required' });
  }

  try {
    const subscription = await Subscription.findById(subscriptionId).populate('groupId', 'groupName subscriptionPrice');
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    const { paymentUrl } = await initiateRenewalPayment(subscription, {
      callbackUrl: `${process.env.FRONTEND_URL}/renewal-callback/${subscriptionId}`,
      metadata: {
        initiatedFrom: 'frontend',
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      paymentUrl,
      amount: subscription.groupId.subscriptionPrice,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('[Renewal Init Error]', {
      subscriptionId,
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  initiateRenewalPayment,
  initializeRenewalForFrontend
};
