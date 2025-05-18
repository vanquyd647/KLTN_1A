const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/StatisticsController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

// Sử dụng adminAuthMiddleware thay vì authenticateToken và authorizeAdmin
router.use(adminAuthMiddleware);

router.get('/sales', StatisticsController.getSalesStatistics);
router.get('/sales/by-date', StatisticsController.getSalesByDateRange);

module.exports = router;
