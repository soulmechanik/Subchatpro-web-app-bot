const asyncHandler = require('express-async-handler');
const Payment = require('../models/payment');
const Subscription = require('../models/subscription');
const Group = require('../models/group');
const GroupOwnerProfile = require('../models/groupowners');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('[getTransactions] Logged in user ID:', userId);

    // Step 1: Find the group owner profile by userId
    const ownerProfile = await GroupOwnerProfile.findOne({ userId });
    console.log('[getTransactions] Found owner profile:', ownerProfile);

    if (!ownerProfile) {
      console.warn('[getTransactions] No owner profile found for this user.');
      return res.status(404).json({ message: 'Group owner profile not found' });
    }

    // Step 2: Find groups linked to this owner profile
    const ownedGroups = await Group.find({ ownerProfileId: ownerProfile._id });
    console.log(`[getTransactions] Found ${ownedGroups.length} groups for owner.`);

    if (ownedGroups.length === 0) {
      console.warn('[getTransactions] No groups found for this owner.');
      return res.status(200).json({ transactions: [] });
    }

    const groupIds = ownedGroups.map(group => group._id);
    console.log('[getTransactions] Group IDs:', groupIds);

    // Step 3: Find all payments related to these groups and populate additional data
    const transactions = await Payment.aggregate([
      {
        $match: { groupId: { $in: groupIds } }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'group'
        }
      },
      {
        $unwind: {
          path: '$group',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'paymentId',
          as: 'subscription'
        }
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          groupId: 1,
          subscriptionId: 1,
          paystackRef: 1,
          amount: 1,
          currency: 1,
          status: 1,
          channel: 1,
          ipAddress: 1,
          paymentContext: 1,
          paidAt: 1,
          linkedRenewalChain: 1,
          createdAt: 1,
          updatedAt: 1,
          groupName: '$group.groupName',
          subscriptionType: {
            $cond: {
              if: { $eq: ['$subscription.paymentType', 'initial'] },
              then: 'New',
              else: 'Renewal'
            }
          },
          subscriberName: '$subscription.subscriberName',
          subscriberEmail: '$subscription.subscriberEmail',
          subscriberPhone: '$subscription.subscriberPhone',
          amountDisplay: {
            $concat: [
              '$currency',
              ' ',
              { $toString: { $divide: [{ $toDouble: '$amount' }, 100] } }
            ]
          }
        }
      }
    ]);

    console.log(`[getTransactions] Found ${transactions.length} transactions with enriched data.`);

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('[getTransactions] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};