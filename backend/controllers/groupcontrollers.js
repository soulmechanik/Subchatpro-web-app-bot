// controllers/groupController.js
const Group = require('../models/group');

const mongoose = require('mongoose');
exports.getGroupById = async (req, res) => {
  const { groupId } = req.params;

  // ✅ Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID format' });
  }

  try {
    const group = await Group.findById(groupId).select(
      'groupName description subscriptionPrice subscriptionFrequency currency isActive'
    );

    if (!group || !group.isActive) {
      return res.status(404).json({ message: 'Group not found or inactive' });
    }

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

