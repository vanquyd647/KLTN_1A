const express = require('express');
const { createOrder, updateOrderStatus, cancelExpiredOrders, completeOrder, deleteOrder, getUserOrders, getAllOrders } = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management API
 */

/**
 * @swagger
 * /v1/api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, createOrder);

/**
 * @swagger
 * /v1/api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/:orderId/status', authMiddleware, updateOrderStatus);

/**
 * @swagger
 * /v1/api/orders/cancel-expired:
 *   post:
 *     summary: Cancel expired orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Expired orders canceled
 */
router.post('/cancel-expired', authMiddleware, cancelExpiredOrders);

/**
 * @swagger
 * /v1/api/orders/{orderId}/complete:
 *   post:
 *     summary: Mark order as completed
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order completed successfully
 */
router.post('/:orderId/complete', authMiddleware, completeOrder);

/**
 * @swagger
 * /v1/api/orders/{orderId}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 */
router.delete('/:orderId', authMiddleware, deleteOrder);

/**
 * @swagger
 * /v1/api/orders/user:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: List of user's orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user', authMiddleware, getUserOrders);

/**
 * @swagger
 * /v1/api/orders:
 *   get:
 *     summary: Get all orders with pagination and filters
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Filter by order ID
 *       - in: query
 *         name: customerName
 *         schema:
 *           type: string
 *         description: Filter by customer name
 *       - in: query
 *         name: customerEmail
 *         schema:
 *           type: string
 *         description: Filter by customer email
 *       - in: query
 *         name: customerPhone  
 *         schema:
 *           type: string
 *         description: Filter by customer phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, getAllOrders);



module.exports = router;
