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

// 🕒 Schedule the job to run at 00:22 UTC (which is 1:22 AM Nigerian time)
const payoutCronJob = cron.schedule('35 0 * * *', async () => {
  console.log('🕒 Daily payout cron job started');

  try {
    const { start, end } = getTodayRange();

    const payments = await Payment.find({
      status: 'success',
      paidAt: { $gte: start, $lte: end },
      transferStatus: { $ne: 'success' } // not already transferred
    });

    if (payments.length === 0) {
      console.log('ℹ️ No successful payments found for today.');
      return;
    }

    console.log(`🔍 Found ${payments.length} payments to process`);

    for (const payment of payments) {
      try {
        const group = await Group.findById(payment.groupId).select('ownerProfileId groupName');

        if (!group) {
          console.warn(`⚠️ Group not found for payment ${payment._id}`);
          continue;
        }

        const ownerProfile = await GroupOwnerProfile.findById(group.ownerProfileId).lean();

        if (!ownerProfile || !ownerProfile.bankDetails) {
          console.warn(`⚠️ Owner or bank details missing for group ${group._id}`);
          continue;
        }

        const {
          accountNumber,
          bankName,
          accountHolderName,
          recipientCode
        } = ownerProfile.bankDetails;

        if (!accountNumber || !bankName || !recipientCode) {
          console.warn(`⚠️ Incomplete bank details or recipient code missing for owner ${ownerProfile._id}`);
          continue;
        }

        // Calculate payout
        const platformFee = 0.05;
        const payoutAmount = payment.amount * (1 - platformFee); // 95% of the amount
        const amountInKobo = Math.round(payoutAmount * 100);

        // Initiate Paystack Transfer using stored recipientCode
        const transferPayload = {
          source: "balance",
          amount: amountInKobo,
          recipient: recipientCode,
          reason: `Payout for subscription - ${group.groupName}`
        };

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

        console.log(`✅ Transfer initiated for payment ${payment._id}: Transfer ID ${transferResponse.data.data.id}`);

        // Update payment
        payment.transferStatus = 'success';
        payment.transferId = transferResponse.data.data.id;
        await payment.save();

      } catch (innerErr) {
        console.error(`❌ Failed to process payment ${payment._id}:`, innerErr.message);
        await Payment.findByIdAndUpdate(payment._id, { transferStatus: 'failed' });
      }
    }

    console.log('✅ Daily payout cron job completed.');

  } catch (err) {
    console.error('💥 Daily payout cron job error:', err.message);
  }
});

// ✅ Start the job
payoutCronJob.start();
console.log('🟢 Daily payout cron job has been scheduled and started.');

// ✅ Optional: trigger manually if RUN_PAYOUT_NOW=true is set in env
if (process.env.RUN_PAYOUT_NOW === 'true') {
  console.log('🧪 RUN_PAYOUT_NOW=true detected. Running cron immediately...');
  payoutCronJob.fireOnTick();
}

module.exports = payoutCronJob;
