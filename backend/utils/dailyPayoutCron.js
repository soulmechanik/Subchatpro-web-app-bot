const cron = require('node-cron');
const axios = require('axios');
const Payment = require('../models/payment'); // adjust path if needed
const Group = require('../models/group'); // adjust path if needed
const GroupOwnerProfile = require('../models/groupowners'); // adjust path if needed

// Helper to calculate today's date range
const getTodayRange = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

// Initialize Cron Job to run every 1 minute
const payoutCronJob = cron.schedule('0 1 * * *', async () => {
  console.log(new Date().toISOString(), '🕒 Daily payout cron job started');

  try {
    const { start, end } = getTodayRange();

    const payments = await Payment.find({
      status: 'success',
      paidAt: { $gte: start, $lte: end },
      transferStatus: { $ne: 'success' } // not already transferred
    });

    if (payments.length === 0) {
      console.log(new Date().toISOString(), 'ℹ️ No successful payments found for today.');
      return;
    }

    console.log(new Date().toISOString(), `🔍 Found ${payments.length} payments to process`);

    for (const payment of payments) {
      try {
        const group = await Group.findById(payment.groupId).select('ownerProfileId groupName');

        if (!group) {
          console.warn(new Date().toISOString(), `⚠️ Group not found for payment ${payment._id}`);
          continue;
        }

        const ownerProfile = await GroupOwnerProfile.findById(group.ownerProfileId).lean();

        if (!ownerProfile || !ownerProfile.bankDetails) {
          console.warn(new Date().toISOString(), `⚠️ Owner or bank details missing for group ${group._id}`);
          continue;
        }

        const {
          accountNumber,
          bankName,
          accountHolderName,
          recipientCode
        } = ownerProfile.bankDetails;

        if (!accountNumber || !bankName || !recipientCode) {
          console.warn(new Date().toISOString(), `⚠️ Incomplete bank details or recipient code missing for owner ${ownerProfile._id}`);
          continue;
        }

        // Calculate payout
        const platformFee = 0.05;
        const payoutAmount = payment.amount * (1 - platformFee); // 95% of the amount
        const amountInKobo = Math.round(payoutAmount * 100);

        const transferPayload = {
          source: "balance",
          amount: amountInKobo,
          recipient: recipientCode,
          reason: `Payout for subscription - ${group.groupName}`
        };

        console.log(new Date().toISOString(), '📦 Sending transfer payload:', transferPayload);

        const transferResponse = await axios.post(
          'https://api.paystack.co/transfer',
          transferPayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(new Date().toISOString(), `✅ Transfer initiated for payment ${payment._id}: Transfer ID ${transferResponse.data.data.id}`);

        // Update payment
        payment.transferStatus = 'success';
        payment.transferId = transferResponse.data.data.id;
        await payment.save();

      } catch (innerErr) {
        const paystackError = innerErr.response?.data || innerErr.message;
        console.error(new Date().toISOString(), `❌ Failed to process payment ${payment._id}:`, paystackError);

        await Payment.findByIdAndUpdate(payment._id, { transferStatus: 'failed' });
      }
    }

    console.log(new Date().toISOString(), '✅ Daily payout cron job completed.');

  } catch (err) {
    console.error(new Date().toISOString(), '💥 Daily payout cron job error:', err.message);
  }
});

// Start the cron job immediately on load
payoutCronJob.start();
console.log(new Date().toISOString(), '🟢 Daily payout cron job scheduled and started.');

module.exports = payoutCronJob;
