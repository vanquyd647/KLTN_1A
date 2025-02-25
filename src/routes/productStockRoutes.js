const express = require('express');
const router = express.Router();
const productStockController = require('../controllers/productStockController');

/**
 * @swagger
 * tags:
 *   name: ProductStocks
 *   description: API quản lý tồn kho sản phẩm
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductStock:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của bản ghi tồn kho
 *         product_id:
 *           type: integer
 *           description: ID của sản phẩm
 *         size_id:
 *           type: integer
 *           description: ID của kích thước
 *         color_id:
 *           type: integer
 *           description: ID của màu sắc
 *         quantity:
 *           type: integer
 *           description: Số lượng tồn kho
 *       example:
 *         id: 1
 *         product_id: 100
 *         size_id: 1
 *         color_id: 2
 *         quantity: 50
 */

/**
 * @swagger
 * /v1/api/product-stocks:
 *   get:
 *     summary: Lấy danh sách tồn kho sản phẩm
 *     tags: [ProductStocks]
 *     description: Trả về danh sách tồn kho của tất cả sản phẩm. Dữ liệu được cache trong Redis với thời gian 5 phút.
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductStock'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Lỗi khi lấy danh sách tồn kho"
 */
router.get('/', productStockController.getProductStocks);

/**
 * @swagger
 * /v1/api/product-stocks/{id}:
 *   put:
 *     summary: Cập nhật số lượng tồn kho theo ID
 *     tags: [ProductStocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bản ghi tồn kho
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Số lượng mới
 */
router.put('/:id', productStockController.updateStock);

module.exports = router;
