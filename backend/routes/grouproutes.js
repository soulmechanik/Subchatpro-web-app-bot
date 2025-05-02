// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupcontrollers');

router.get('/:groupId', groupController.getGroupById);

module.exports = router;

