// controllers/groupOwner.js
const axios = require('axios');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const GroupOwner = require('../models/groupowners');
const Group = require('../models/group');
const User = require('../models/user');
const Subscription = require('../models/subscription');
const Payment = require('../models/payment');

const backendUrl = process.env.BACKEND_URL || "http://localhost:5002/";

// Onboard Group Owner

exports.onboardGroupOwnerController = asyncHandler(async (req, res) => {
  const {
    name,
    phoneNumber,
    telegramUsername,
    accountHolderName,
    accountNumber,
    bankName
  } = req.body;

  if (!name || !phoneNumber || !accountHolderName || !accountNumber || !bankName) {
    res.status(400);
    throw new Error('All required fields must be filled.');
  }

  const existingProfile = await GroupOwner.findOne({ userId: req.user._id });
  if (existingProfile) {
    res.status(400);
    throw new Error('This user already has a Group Owner profile.');
  }

  // Step 1: Get bank code from Paystack
  const bankListResponse = await axios.get('https://api.paystack.co/bank', {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  });

  const bank = bankListResponse.data.data.find(
    b => b.name.toLowerCase() === bankName.toLowerCase()
  );

  if (!bank) {
    res.status(400);
    throw new Error('Bank name not found on Paystack.');
  }

  const bankCode = bank.code;

  // Step 2: Create transfer recipient
  const recipientResponse = await axios.post(
    'https://api.paystack.co/transferrecipient',
    {
      type: 'nuban',
      name: accountHolderName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const recipientCode = recipientResponse.data.data.recipient_code;

  // Step 3: Create the GroupOwner profile
  const profile = await GroupOwner.create({
    userId: req.user._id,
    name,
    phoneNumber,
    telegramUsername,
    bankDetails: {
      accountHolderName,
      accountNumber,
      bankName,
      bankCode,
      recipientCode
    }
  });

  console.log(`✅ Group Owner onboarded successfully: ${profile._id}`);

  // Step 4: Update onboarded status on user
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
  
    const shareLink = `${backendUrl}join/${newGroup._id}`;
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


// Helper to get Paystack bank list and find bank code by name
const getBankCode = async (bankName) => {
  const response = await axios.get('https://api.paystack.co/bank', {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const banks = response.data.data;
  const bank = banks.find(b => b.name.toLowerCase() === bankName.toLowerCase());
  return bank?.code;
};

// Helper to resolve account number to account name via Paystack
const resolveAccountName = async (accountNumber, bankCode) => {
  const response = await axios.get(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    }
  );
  return response.data.data.account_name;
};

// Helper to create or update Paystack transfer recipient
const createTransferRecipient = async (accountHolderName, accountNumber, bankCode) => {
  const response = await axios.post(
    'https://api.paystack.co/transferrecipient',
    {
      type: 'nuban',
      name: accountHolderName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.data.recipient_code;
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const objectId = new mongoose.Types.ObjectId(userId);

    const { name, phoneNumber, telegramUsername, bankDetails } = req.body;

    let updatedBankDetails = null;

    if (bankDetails && bankDetails.accountNumber && bankDetails.bankName) {
      // 1. Get bank code
      const bankCode = await getBankCode(bankDetails.bankName);
      if (!bankCode) {
        return res.status(400).json({ message: 'Invalid bank name.' });
      }

      // 2. Resolve account name from Paystack
      const accountHolderName = await resolveAccountName(bankDetails.accountNumber, bankCode);

      // 3. Create transfer recipient on Paystack
      const recipientCode = await createTransferRecipient(accountHolderName, bankDetails.accountNumber, bankCode);

      // Prepare bank details object to save
      updatedBankDetails = {
        accountHolderName,
        accountNumber: bankDetails.accountNumber,
        bankName: bankDetails.bankName,
        bankCode,
        recipientCode
      };
    }

    // Update the user profile in DB
    const updated = await GroupOwner.findOneAndUpdate(
      { userId: objectId },
      {
        $set: {
          ...(name && { name }),
          ...(phoneNumber && { phoneNumber }),
          ...(telegramUsername && { telegramUsername }),
          ...(updatedBankDetails && { bankDetails: updatedBankDetails })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.status(200).json({
      message: 'Profile updated successfully.',
      updatedProfile: updated
    });
  } catch (error) {
    console.error("🔥 Error updating settings:", error.response?.data || error.message);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
