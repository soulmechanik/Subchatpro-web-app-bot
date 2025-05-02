require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('./models/subscription'); // Ensure this path is correct
const { sendGracePeriodEmail } = require('./utils/notificationUtils');


async function testGraceEmail() {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Verify Subscription model is loaded
    if (!mongoose.models.Subscription) {
      throw new Error('Subscription model not registered!');
    }

    // 3. Load the subscription
    const sub = await Subscription.findById("68052e69c770dc0d847cf068");
    if (!sub) throw new Error('❌ Subscription not found');
    console.log('📝 Loaded subscription:', sub._id);

    // 4. Trigger email
    await sendGracePeriodEmail(sub);
    console.log('📧 Email sent. Checking notificationLog...');

    // 5. Verify update
    const updatedSub = await Subscription.findById(sub._id);
    console.log('🔔 Notification log:', updatedSub.notificationLog);

  } catch (err) {
    console.error('💥 Test failed:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🛑 MongoDB disconnected');
  }
}

testGraceEmail();