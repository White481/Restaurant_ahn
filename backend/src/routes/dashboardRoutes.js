const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

// ดูแดชบอร์ด: admin เท่านั้น
router.get('/', requireAuth(['admin']), dashboardController.getDashboardStats);

module.exports = router;
