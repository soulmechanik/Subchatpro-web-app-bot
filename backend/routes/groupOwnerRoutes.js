const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const groupOwnerController = require('../controllers/groupOwner');

  


// Group Owner Onboarding
router.post('/onboard', protect, groupOwnerController.onboardGroupOwnerController);

// Group Management
router.post('/creategroup', protect, groupOwnerController.createNewGroupController);

// Dashboard Overview
router.get('/overview', protect, groupOwnerController.getOverview);


// New route for fetching groups
router.get('/groups', protect, groupOwnerController.getOwnedGroups);

// ✅ GET current GroupOwner settings
router.get('/settings', protect, groupOwnerController.getSettings);

// ✅ UPDATE GroupOwner settings
router.put('/settings', protect, groupOwnerController.updateSettings);



module.exports = router;