const sendEmail = require('./sendEmail');
const Subscription = require('../models/subscription');
const Group = require('../models/group'); // Add this import

exports.sendRenewalNotice = async (subscription) => {
    const group = await Group.findById(subscription.groupId);
    
    await sendEmail(
      subscription.subscriberEmail,
      `Renew ${group.groupName} Subscription`,
      `Hi ${subscription.subscriberName},\n\n` +
      `Your subscription expired. Renew now:\n` +
      `${process.env.FRONTEND_URL}/renew/${subscription._id}`
    );
  
    await Subscription.findByIdAndUpdate(subscription._id, {
      $set: { status: "expired" },
      $push: {
        notificationLog: {
          sentAt: new Date(),
          type: "renewal_notice",
          channel: "email"
        }
      }
    });
  };




  