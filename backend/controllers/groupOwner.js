// controllers/groupOwner.js
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const GroupOwner = require('../models/groupowners');
const Group = require('../models/group');
const User = require('../models/user');
const Subscription = require('../models/subscription');
const Payment = require('../models/payment');


// Onboard Group Owner

exports.onboardGroupOwnerController = asyncHandler(async (req, res) => {
    const { name, phoneNumber, telegramUsername, accountHolderName, accountNumber, bankName } = req.body;
  
    if (!name || !phoneNumber || !accountHolderName || !accountNumber || !bankName) {
      res.status(400);
      throw new Error('All required fields must be filled.');
    }
  
    const existingProfile = await GroupOwner.findOne({ userId: req.user._id });
    if (existingProfile) {
      res.status(400);
      throw new Error('This user already has a Group Owner profile.');
    }
  
    // Create the GroupOwner profile
    const profile = await GroupOwner.create({
      userId: req.user._id, 
      name,
      phoneNumber,
      telegramUsername,
      bankDetails: {
        accountHolderName,
        accountNumber,
        bankName
      }
    });
  
    // Log success
    console.log(`Group Owner onboarded successfully: ${profile._id}`);
  
    // Update the onboarded status of the user
    await User.findByIdAndUpdate(req.user._id, { onboarded: true });
  
    res.status(201).json({
      message: 'Group Owner onboarded successfully.',
      profile
    });
  });
  
  
  exports.createNewGroupController = asyncHandler(async (req, res) => {
    const {
      groupName,
      telegramGroupLink,
      telegramGroupId, // 👈 New field added here
      description,
      category,
      subscriptionFrequency,
      subscriptionPrice,
      currency
    } = req.body;
  
    if (!groupName || !telegramGroupLink || !telegramGroupId || !subscriptionFrequency || !subscriptionPrice) {
      res.status(400);
      throw new Error('All required fields must be filled.');
    }
  
    const ownerProfile = await GroupOwner.findOne({ userId: req.user._id });
  
    if (!ownerProfile) {
      res.status(400);
      throw new Error('Group Owner profile not found.');
    }
  
    const newGroup = new Group({
      ownerProfileId: ownerProfile._id,
      groupName,
      telegramGroupLink,
      telegramGroupId, // 👈 Save to DB
      description,
      category,
      subscriptionFrequency,
      subscriptionPrice,
      currency
    });
  
    const shareLink = `http://localhost:5002/join/${newGroup._id}`;
    newGroup.shareLink = shareLink;
  
    await newGroup.save();
  
    ownerProfile.groups.push(newGroup._id);
    await ownerProfile.save();
  
    res.status(201).json({
      message: 'Group created successfully.',
      group: newGroup
    });
  });
  
  

  // controllers/dashboardController.js

  exports.getOverview = asyncHandler(async (req, res) => {
    try {
      // 1. Get group owner profile
      const groupOwner = await GroupOwner.findOne({ userId: req.user._id });
      if (!groupOwner) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group owner profile not found' 
        });
      }
  
      // 2. Get all groups owned by this user
      const groupIds = groupOwner.groups.map(g => g._id);
  
      // 3. Get summary stats (parallel queries for performance)
      const [
        totalEarnings,
        activeSubscribers,
        pendingPayout,
        subscriptionCount,
        renewalCount
      ] = await Promise.all([
        // Total earnings calculation
        Payment.aggregate([
          { $match: { groupId: { $in: groupIds }, status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // Active subscribers count
        Subscription.countDocuments({ 
          groupId: { $in: groupIds },
          status: 'active',
          expiresAt: { $gt: new Date() }
        }),
        
        // Pending payout calculation
        Payment.aggregate([
          { $match: { 
            groupId: { $in: groupIds }, 
            status: 'success', 
            paidOut: false 
          } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // Total subscription count
        Subscription.countDocuments({ groupId: { $in: groupIds } }),
        
        // Renewal count
        Subscription.countDocuments({ 
          groupId: { $in: groupIds }, 
          isRenewal: true 
        })
      ]);
  
      // 4. Get revenue trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
      const revenueTrend = await Payment.aggregate([
        { 
          $match: { 
            groupId: { $in: groupIds },
            status: 'success',
            paidAt: { $gte: sixMonthsAgo }
          } 
        },
        {
          $group: {
            _id: { $month: '$paidAt' },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } },
        { 
          $project: {
            month: { 
              $let: {
                vars: {
                  monthsInJs: [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ]
                },
                in: { $arrayElemAt: ['$$monthsInJs', { $subtract: ['$_id', 1] }] }
              }
            },
            revenue: 1,
            _id: 0
          }
        }
      ]);
  
      // 5. Get subscription tiers (fixed version)
      const subscriptionTiers = await Subscription.aggregate([
        { $match: { groupId: { $in: groupIds }, status: 'active' } },
        {
          $lookup: {
            from: 'groups',
            localField: 'groupId',
            foreignField: '_id',
            as: 'group'
          }
        },
        { $unwind: '$group' },
        {
          $group: {
            _id: '$group.subscriptionPrice',
            count: { $sum: 1 }
          }
        },
        { 
          $project: { 
            tier: { 
              $concat: ["₦", { $toString: "$_id" }] 
            },
            count: 1,
            _id: 0 
          } 
        }
      ]);
  
      // 6. Get recent activity (last 10)
      const recentActivity = await Subscription.find({ groupId: { $in: groupIds } })
        .sort('-subscribedAt')
        .limit(10)
        .select('subscriberName paymentId status subscribedAt')
        .populate({
          path: 'paymentId',
          select: 'amount currency'
        });
  
      // 7. Format final response
      const response = {
        summary: {
          totalEarnings: totalEarnings[0]?.total || 0,
          activeSubscribers,
          renewalRate: subscriptionCount > 0 
            ? Math.round((renewalCount / subscriptionCount) * 100) 
            : 0,
          pendingPayout: pendingPayout[0]?.total || 0
        },
        revenueTrend,
        subscriptionTiers,
        recentActivity: recentActivity.map(sub => ({
          user: sub.subscriberName,
          action: sub.status === 'active' ? 'subscribed' : sub.status,
          amount: sub.paymentId?.amount 
            ? `₦${sub.paymentId.amount.toLocaleString('en-NG')}` 
            : 'N/A',
          date: sub.subscribedAt.toISOString()
        }))
      };
  
      res.status(200).json({
        success: true,
        data: response
      });
  
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error loading dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

 exports.getOwnedGroups = async (req, res) => {
    try {
      // 1. Find the group owner profile
      const groupOwner = await GroupOwner.findOne({ userId: req.user._id })
        .populate({
          path: 'groups',
          select: 'groupName description subscriptionPrice subscriptionFrequency createdAt telegramGroupLink'
        })
        .lean();
  
      if (!groupOwner) {
        return res.status(404).json({
          success: false,
          message: 'Group owner profile not found'
        });
      }
  
      // 2. Get subscriber counts for all groups in parallel
      const groupsWithMembers = await Promise.all(
        groupOwner.groups.map(async group => {
          const activeSubscribers = await Subscription.countDocuments({
            groupId: group._id,
            status: 'active',
            expiresAt: { $gt: new Date() }
          });
  
          return {
            ...group,
            membersCount: activeSubscribers
          };
        })
      );
  
      // 3. Format the response
      const formattedGroups = groupsWithMembers.map(group => ({
        id: group._id.toString(),
        name: group.groupName,
        description: group.description,
        price: group.subscriptionPrice,
        currency: 'NGN',
        frequency: group.subscriptionFrequency,
        members: group.membersCount,
        telegramLink: group.telegramGroupLink,
        createdAt: group.createdAt,
        shareLink: `${process.env.FRONTEND_URL}/join/${group._id.toString()}`
      }));
  
      res.status(200).json({
        success: true,
        count: formattedGroups.length,
        data: formattedGroups
      });
  
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching groups',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  

 
// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("🔍 Received userId from auth middleware:", userId);

    const objectId = new mongoose.Types.ObjectId(userId);
    console.log("🧾 Converted to ObjectId:", objectId);

    const groupOwner = await GroupOwner.findOne({ userId: objectId });

    if (!groupOwner) {
      console.log("❌ Group owner not found with userId:", objectId);
      return res.status(404).json({ message: 'Profile not found.' });
    }

    console.log("✅ Found GroupOwner profile:", groupOwner);

    const { name, phoneNumber, telegramUsername, bankDetails } = groupOwner;

    res.status(200).json({
      name,
      phoneNumber,
      telegramUsername,
      bankDetails
    });
  } catch (error) {
    console.error("🔥 Error fetching settings:", error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("✏️ Received update request for userId:", userId);

    const objectId = new mongoose.Types.ObjectId(userId);

    const { name, phoneNumber, telegramUsername, bankDetails } = req.body;

    console.log("📦 New data received:", {
      name,
      phoneNumber,
      telegramUsername,
      bankDetails
    });

    const updated = await GroupOwner.findOneAndUpdate(
      { userId: objectId },
      {
        $set: {
          ...(name && { name }),
          ...(phoneNumber && { phoneNumber }),
          ...(telegramUsername && { telegramUsername }),
          ...(bankDetails && {
            bankDetails: {
              accountHolderName: bankDetails.accountHolderName,
              accountNumber: bankDetails.accountNumber,
              bankName: bankDetails.bankName
            }
          })
        }
      },
      { new: true }
    );

    if (!updated) {
      console.log("❌ No GroupOwner found to update.");
      return res.status(404).json({ message: 'Profile not found.' });
    }

    console.log("✅ Profile updated successfully:", updated);

    res.status(200).json({
      message: 'Profile updated successfully.',
      updatedProfile: updated
    });
  } catch (error) {
    console.error("🔥 Error updating settings:", error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};