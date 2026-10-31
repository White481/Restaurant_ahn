const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// ดูแดชบอร์ด: admin เท่านั้น
router.get('/', requireAuth(PERMISSIONS.viewDashboard), dashboardController.getDashboardStats);

module.exports = router;
