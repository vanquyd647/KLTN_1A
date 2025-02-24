// routes/CarrierRoute.js
const express = require('express');
const router = express.Router();
const CarrierController = require('../controllers/CarrierController');

/**
 * @swagger
 * tags:
 *   name: Carriers
 *   description: Quản lý đơn vị vận chuyển
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Carrier:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: ID của đơn vị vận chuyển
 *         name:
 *           type: string
 *           description: Tên đơn vị vận chuyển
 *         description:
 *           type: string
 *           description: Mô tả về đơn vị vận chuyển
 *         status:
 *           type: string
 *           description: Trạng thái hoạt động
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /v1/api/carriers:
 *   post:
 *     summary: Tạo mới đơn vị vận chuyển
 *     tags: [Carriers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Carrier'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Carrier'
 *       500:
 *         description: Lỗi server
 */
router.post('/', CarrierController.create);

/**
 * @swagger
 * /v1/api/carriers:
 *   get:
 *     summary: Lấy danh sách đơn vị vận chuyển
 *     tags: [Carriers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng item trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Thành công
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
 *                     $ref: '#/components/schemas/Carrier'
 */
router.get('/', CarrierController.getAll);

/**
 * @swagger
 * /v1/api/carriers/{id}:
 *   get:
 *     summary: Lấy thông tin đơn vị vận chuyển theo ID
 *     tags: [Carriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn vị vận chuyển
 *     responses:
 *       200:
 *         description: Thành công
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
 *                   $ref: '#/components/schemas/Carrier'
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', CarrierController.getById);

/**
 * @swagger
 * /v1/api/carriers/{id}:
 *   put:
 *     summary: Cập nhật thông tin đơn vị vận chuyển
 *     tags: [Carriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Carrier'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                   $ref: '#/components/schemas/Carrier'
 */
router.put('/:id', CarrierController.update);

/**
 * @swagger
 * /v1/api/carriers/{id}:
 *   delete:
 *     summary: Xóa đơn vị vận chuyển
 *     tags: [Carriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
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
 *                 message:
 *                   type: string
 *                   example: Carrier deleted successfully
 */
router.delete('/:id', CarrierController.delete);

/**
 * @swagger
 * /v1/api/carriers/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn vị vận chuyển
 *     tags: [Carriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: Trạng thái mới
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
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
 *                   $ref: '#/components/schemas/Carrier'
 */
router.patch('/:id/status', CarrierController.updateStatus);

module.exports = router;
