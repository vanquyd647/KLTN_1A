// routes/orderTrackingRoutes.js
const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');

/**
 * @swagger
 * tags:
 *   name: Order Tracking
 *   description: API endpoints for tracking orders
 * 
 * components:
 *   schemas:
 *     OrderTrackingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Tra cứu đơn hàng thành công
 *         data:
 *           type: object
 *           properties:
 *             orderId:
 *               type: string
 *               example: "ORD123456789"
 *             orderDate:
 *               type: string
 *               format: date-time
 *               example: "2024-04-17T08:00:00Z"
 *             status:
 *               type: string
 *               enum: [PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED, CANCELLED, RETURNED]
 *               example: SHIPPING
 *             deliveryInfo:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   example: "123 Nguyễn Du, Q.1, TP.HCM"
 *                 recipient:
 *                   type: string
 *                   example: "Nguyễn Văn A"
 *                 phone:
 *                   type: string
 *                   example: "0901234567"
 *                 trackingNumber:
 *                   type: string
 *                   example: "TRACK123456"
 *                 estimatedDelivery:
 *                   type: string
 *                   format: date
 *                   example: "2024-04-20"
 *                 shippingMethod:
 *                   type: string
 *                   example: "Express"
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: string
 *                     example: "prod123"
 *                   name:
 *                     type: string
 *                     example: "Áo thun nam"
 *                   image:
 *                     type: string
 *                     example: "https://example.com/image.jpg"
 *                   price:
 *                     type: number
 *                     example: 299000
 *                   quantity:
 *                     type: integer
 *                     example: 2
 *                   size:
 *                     type: string
 *                     example: "L"
 *                   color:
 *                     type: string
 *                     example: "Đen"
 *             payment:
 *               type: object
 *               properties:
 *                 method:
 *                   type: string
 *                   example: "COD"
 *                 status:
 *                   type: string
 *                   enum: [PENDING, PAID, REFUNDED]
 *                   example: "PENDING"
 *                 total:
 *                   type: number
 *                   example: 598000
 *                 paid:
 *                   type: number
 *                   example: 0
 *             timeline:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "CONFIRMED"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-04-17T08:30:00Z"
 *                   description:
 *                     type: string
 *                     example: "Đơn hàng đã được xác nhận"
 *                   completed:
 *                     type: boolean
 *                     example: true
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Không tìm thấy đơn hàng
 * 
 * /api/v1/order-tracking/{orderId}:
 *   get:
 *     summary: Tra cứu thông tin đơn hàng
 *     description: Tra cứu chi tiết đơn hàng thông qua mã đơn hàng và email/số điện thoại
 *     tags: [Order Tracking]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã đơn hàng cần tra cứu
 *       - in: query
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Email hoặc số điện thoại đặt hàng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderTrackingResponse'
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Không có quyền truy cập đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:orderId', orderTrackingController.trackOrder);

module.exports = router;
