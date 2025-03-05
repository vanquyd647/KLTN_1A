const express = require('express');
const router = express.Router();
const RevenueController = require('../controllers/revenueController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Revenue
 *   description: Revenue management API
 */

/**
 * @swagger
 * /v1/api/revenue/stats:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Revenue]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 */
router.get('/stats', authMiddleware, RevenueController.getRevenueStats);

/**
 * @swagger
 * /v1/api/revenue/daily:
 *   get:
 *     summary: Get daily revenue
 *     tags: [Revenue]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date to get revenue for (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Daily revenue retrieved successfully
 */
router.get('/daily', authMiddleware, RevenueController.getDailyRevenue);

/**
 * @swagger
 * /v1/api/revenue/monthly:
 *   get:
 *     summary: Get monthly revenue
 *     tags: [Revenue]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year to get revenue for
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month to get revenue for (1-12)
 *     responses:
 *       200:
 *         description: Monthly revenue retrieved successfully
 */
router.get('/monthly', authMiddleware, RevenueController.getMonthlyRevenue);

module.exports = router;
