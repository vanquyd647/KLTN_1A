const express = require('express');
const { createOrder, getOrderById, updateOrderStatus, cancelExpiredOrders, completeOrder, deleteOrder } = require('../controllers/orderController');
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
 * /v1/api/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
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
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', authMiddleware, getOrderById);

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

module.exports = router;
