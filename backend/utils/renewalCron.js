const cron = require('node-cron');
const Subscription = require('../models/subscription');
const sendEmail = require('../utils/sendEmail');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get cron schedule from env, fallback to every 1 hour if not set
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 * * * *';

console.log(`✅ Renewal cron job loaded and scheduled with timing: [${CRON_SCHEDULE}]`);

cron.schedule(CRON_SCHEDULE, async () => {
  console.log('⏰ Running subscription expiration cron job at', new Date().toLocaleString());

  try {
    const now = new Date();

    const totalSubscriptions = await Subscription.countDocuments({});
    if (totalSubscriptions === 0) {
      console.log('ℹ️ No subscriptions exist in the database yet.');
      return;
    }

    const subscriptions = await Subscription.find({
      expiresAt: { $lt: now },
      status: 'active'
    }).populate('groupId');

    if (subscriptions.length === 0) {
      console.log('ℹ️ No subscriptions found that need to be expired.');
      return;
    }

    console.log(`🔎 Found ${subscriptions.length} subscriptions to expire.`);

    const expiredSummary = [];

    for (const subscription of subscriptions) {
      try {
        subscription.status = 'expired';
        await subscription.save();

        const amountInNaira = subscription.groupId.subscriptionPrice;
        const formattedAmount = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 2
        }).format(amountInNaira);

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

        console.log(`📧 Expired and emailed subscription: ${subscription.subscriberEmail}`);
        expiredSummary.push({
          email: subscription.subscriberEmail,
          group: subscription.groupId.groupName,
          expiredAt: now.toLocaleString()
        });

      } catch (emailError) {
        console.error(`❌ Failed to process subscription for ${subscription.subscriberEmail}:`, emailError);
      }
    }

    console.log('✅ Completed cron job.');
    console.table(expiredSummary);

  } catch (err) {
    console.error('❌ Fatal error in subscription expiration cron job:', err);
  }
});
