const mongoose = require('mongoose');
const Payment = require('../models/payment');
const Subscription = require('../models/subscription');
const Group = require('../models/group');
const GroupOwnerProfile = require('../models/groupowners'); 
const User = require('../models/user'); 
const sendEmail = require('../utils/sendEmail');

exports.handleWebhook = async (req, res) => {
  console.log('🔄 Starting webhook processing');

  try {
    // 🔥 Parse the raw buffer into JSON
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (parseErr) {
      console.error('❌ Failed to parse webhook body:', parseErr.message);
      return res.status(400).send('Invalid webhook payload');
    }

    console.log('📩 Received event:', event?.event);
    console.log('📦 Full Event Data:', JSON.stringify(event, null, 2));

    if (event?.event !== 'charge.success') {
      console.warn('⚠️ Unsupported event type:', event?.event);
      return res.status(400).send('Unsupported event type');
    }

    const { data } = event;
    const reference = data.reference;
    const metadata = data.metadata || {};

    console.log('🔍 Processing payment reference:', reference);

    const existingPayment = await Payment.findOne({ paystackRef: reference });
    if (existingPayment?.status === 'success') {
      console.log('🔄 Duplicate payment detected:', reference);
      return res.sendStatus(200);
    }

    if (!metadata.groupId) {
      console.error('❌ Missing groupId in metadata:', { reference, metadata });
      return res.status(400).send('Missing groupId');
    }

    console.log('🔍 Fetching group:', metadata.groupId);
    const group = await Group.findById(metadata.groupId)
      .select('+subscriptionFrequency +groupName +ownerProfileId');

    if (!group) {
      console.error('❌ Group not found:', metadata.groupId);
      return res.status(404).send('Group not found');
    }
    console.log('✅ Group found:', group.groupName);

    const isRenewal = metadata.paymentType === 'renewal';
    const paidAt = new Date(data.paid_at || Date.now());
    const telegramUsername = metadata.telegramUsername || null;
    const channel = metadata.channel || 'telegram';

    const paymentData = {
      name: metadata.fullName || data.customer?.name || 'Anonymous',
      email: data.customer?.email,
      phone: metadata.phone || data.customer?.phone,
      groupId: group._id,
      paystackRef: reference,
      status: 'success',
      paidAt,
      ipAddress: data.ip_address,
      channel: data.channel || 'bank',
      amount: data.amount / 100,
      currency: data.currency || 'NGN',
      paymentContext: isRenewal ? 'renewal' : 'initial'
    };

    console.log('💾 Saving payment data');
    const payment = existingPayment 
      ? await Payment.findByIdAndUpdate(existingPayment._id, { $set: paymentData }, { new: true })
      : await new Payment(paymentData).save();
    console.log('✅ Payment saved:', payment._id);

    const expiresAt = calculateNewExpiry(paidAt, group.subscriptionFrequency);
    let subscription;
    console.log('🔄 Processing subscription, isRenewal:', isRenewal);

    if (isRenewal) {
      if (!metadata.subscriptionId) {
        console.error('❌ Renewal missing subscriptionId');
        return res.status(400).send('Missing subscriptionId for renewal');
      }

      subscription = await Subscription.findOneAndUpdate(
        { _id: metadata.subscriptionId },
        {
          $set: {
            expiresAt,
            status: 'active',
            paymentId: payment._id,
            paymentType: 'renewal'
          },
          $inc: { renewalCount: 1 }
        },
        { new: true }
      );
      console.log('🔄 Renewed subscription:', subscription._id);
    } else {
      subscription = await new Subscription({
        subscriberName: payment.name,
        subscriberEmail: payment.email,
        subscriberPhone: payment.phone,
        telegramUsername,
        channel,
        groupId: group._id,
        paymentId: payment._id,
        paystackRef: reference,
        subscribedAt: paidAt,
        expiresAt,
        status: 'active',
        paymentType: 'initial',
        autoRenew: metadata.autoRenew === 'true'
      }).save();
      console.log('🆕 New subscription created:', subscription._id);
    }

    payment.subscriptionId = subscription._id;
    await payment.save();
    console.log('🔗 Linked payment to subscription');

    if (payment.email) {
      try {
        console.log('📧 Sending subscriber confirmation');
        await sendConfirmationEmail({ payment, group, isRenewal, expiresAt });
        console.log('✅ Subscriber email sent to:', payment.email);
      } catch (emailErr) {
        console.error('❌ Subscriber email failed:', {
          error: emailErr.message,
          email: payment.email
        });
      }
    }

    if (group.ownerProfileId) {
      try {
        console.log('👔 Looking up group owner profile:', group.ownerProfileId);
        const ownerProfile = await GroupOwnerProfile.findById(group.ownerProfileId).lean();

        if (!ownerProfile) {
          console.warn('⚠️ No owner profile found:', group.ownerProfileId);
        } else {
          const ownerUser = await User.findById(ownerProfile.userId).select('email').lean();

          if (!ownerUser?.email) {
            console.warn('⚠️ Owner user has no email:', {
              userId: ownerProfile.userId,
              profileId: ownerProfile._id
            });
          } else {
            console.log('📧 Preparing owner notification for:', ownerUser.email);
            await sendOwnerNotification({
              ownerEmail: ownerUser.email,
              ownerName: ownerProfile.name || 'Group Owner',
              groupName: group.groupName,
              subscriberName: payment.name,
              amount: data.amount,
              paymentDate: paidAt,
              paymentMethod: payment.channel,
              isRenewal,
              reference: payment.paystackRef
            });
            console.log('✅ Owner notification sent to:', ownerUser.email);
          }
        }
      } catch (ownerNotifyErr) {
        console.error('❌ Owner notification failed:', {
          error: ownerNotifyErr.message,
          stack: ownerNotifyErr.stack
        });
      }
    } else {
      console.warn('⚠️ Group has no ownerProfileId:', group._id);
    }

    console.log('🎉 Successfully processed payment', {
      paymentId: payment._id,
      subscriptionId: subscription._id,
      amount: payment.amount,
      group: group.groupName,
      reference
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error('💥 Webhook processing failed:', {
      error: err.message,
      stack: err.stack,
      event: req.body.toString() // log the raw data
    });
    return res.status(500).send('Processing failed');
  }
};



// (Keep the existing sendConfirmationEmail, sendOwnerNotification, and calculateNewExpiry functions exactly as they were)

async function sendConfirmationEmail({
  payment,
  group,
  isRenewal,
  expiresAt
}) {
  try {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: payment.currency || 'NGN',
      minimumFractionDigits: 2
    }).format(payment.amount);

    const subject = isRenewal 
      ? `✅ Subscription Renewed: ${group.groupName}` 
      : `🎉 Welcome to ${group.groupName}`;

    const text = `
      Hi ${payment.name},

      ${isRenewal 
        ? `Your subscription to ${group.groupName} has been successfully renewed.` 
        : `Thank you for subscribing to ${group.groupName}.`}

      Payment Details:
      - Amount: ${formattedAmount}
      - Date: ${new Date(payment.paidAt).toLocaleString('en-NG')}
      - Payment Method: ${payment.channel}
      - Reference: ${payment.paystackRef}
      - Access Valid Until: ${new Date(expiresAt).toLocaleDateString('en-NG')}

      ${!isRenewal ? `
      Access your group here:
      ${process.env.FRONTEND_URL}/groups/${group._id}
      ` : ''}

      Need help? Contact our support team at ${process.env.SUPPORT_EMAIL}

      Best regards,
      The ${group.groupName} Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2ecc71; margin-top: 0;">
            ${isRenewal ? 'Subscription Renewed' : 'Welcome!'}
          </h2>
          
          <p>Dear ${payment.name},</p>
          
          <p>${isRenewal 
            ? `Your subscription to <strong>${group.groupName}</strong> has been successfully renewed.` 
            : `Thank you for joining <strong>${group.groupName}</strong>.`}
          </p>
          
          <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #eee;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> ${formattedAmount}</p>
            <p><strong>Date:</strong> ${new Date(payment.paidAt).toLocaleString('en-NG')}</p>
            <p><strong>Method:</strong> ${payment.channel}</p>
            <p><strong>Reference:</strong> ${payment.paystackRef}</p>
            <p><strong>Access Until:</strong> ${new Date(expiresAt).toLocaleDateString('en-NG')}</p>
          </div>
          
          ${!isRenewal ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${group.telegramGroupLink}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;
                      display: inline-block;">
              Access Group Now
            </a>
          </div>
          ` : ''}
          
          <p>Need help? <a href="mailto:${process.env.SUPPORT_EMAIL}">Contact our support team</a></p>
          
          <p style="margin-bottom: 0;">Best regards,<br>The ${group.groupName} Team</p>
        </div>
      </div>
    `;

    await sendEmail(payment.email, subject, text, html);
    console.log(`✅ Confirmation sent to subscriber: ${payment.email}`);
  } catch (error) {
    console.error('❌ Failed to send subscriber confirmation:', {
      error: error.message,
      email: payment?.email
    });
    throw error;
  }
}



async function sendOwnerNotification({
  ownerEmail,
  ownerName,
  groupName,
  subscriberName,
  amount,
  paymentDate,
  paymentMethod,
  isRenewal,
  reference
}) {
  try {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount / 100);

    const subject = `💰 New ${isRenewal ? 'Renewal' : 'Subscription'} for ${groupName}`;
    
    const text = `
      Hi ${ownerName},

      You've received a new payment for ${groupName}:

      Payment Details:
      - Member: ${subscriberName}
      - Amount: ${formattedAmount}
      - Date: ${new Date(paymentDate).toLocaleString('en-NG')}
      - Type: ${isRenewal ? 'Renewal' : 'New Subscription'}
      - Payment Method: ${paymentMethod}
      - Reference: ${reference}

      View complete details in your dashboard:
      ${process.env.FRONTEND_URL}/owner/transactions/${reference}

      Best regards,
      ${process.env.APP_NAME || 'SubChat'} Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2ecc71; margin-top: 0;">
            New ${isRenewal ? 'Renewal' : 'Subscription'} Payment
          </h2>
          
          <p>Hi ${ownerName},</p>
          
          <p>You've received a payment for <strong>${groupName}</strong>:</p>
          
          <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #eee;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Member:</strong> ${subscriberName}</p>
            <p><strong>Amount:</strong> ${formattedAmount}</p>
            <p><strong>Date:</strong> ${new Date(paymentDate).toLocaleString('en-NG')}</p>
            <p><strong>Type:</strong> ${isRenewal ? 'Renewal' : 'New Subscription'}</p>
            <p><strong>Method:</strong> ${paymentMethod}</p>
            <p><strong>Reference:</strong> ${reference}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.FRONTEND_URL}/owner/transactions/${reference}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;
                      display: inline-block;">
              View in Dashboard
            </a>
          </div>
          
          <p style="margin-bottom: 0;">Best regards,<br>The ${process.env.APP_NAME || 'SubChat'} Team</p>
        </div>
      </div>
    `;

    await sendEmail(ownerEmail, subject, text, html);
    console.log(`✅ Owner notification sent to: ${ownerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send owner notification:', {
      error: error.message,
      email: ownerEmail
    });
    throw error;
  }
}


// Improved expiry calculation with timezone consideration
function calculateNewExpiry(startDate, frequency) {
  const date = new Date(startDate);
  switch (frequency) {
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'biannual': date.setMonth(date.getMonth() + 6); break;
    case 'annual': date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1); // Default monthly
  }
  return date;
}


