const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Quản lý địa chỉ người dùng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - street
 *         - ward
 *         - district
 *         - city
 *         - country
 *         - address_type
 *         - is_default
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: ID của địa chỉ (tự động tăng)
 *         user_id:
 *           type: integer
 *           format: int64
 *           description: ID của người dùng sở hữu địa chỉ
 *         street:
 *           type: string
 *           description: Số nhà, tên đường
 *         ward:
 *           type: string
 *           description: Phường/Xã
 *         district:
 *           type: string
 *           description: Quận/Huyện
 *         city:
 *           type: string
 *           description: Tỉnh/Thành phố
 *         country:
 *           type: string
 *           description: Quốc gia
 *           default: Vietnam
 *         address_type:
 *           type: string
 *           description: Loại địa chỉ (home/office/other)
 *           enum: [home, office, other]
 *         is_default:
 *           type: boolean
 *           description: Đánh dấu là địa chỉ mặc định
 *           default: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo địa chỉ
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật địa chỉ
 */

/**
 * @swagger
 * /v1/api/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ của người dùng
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách địa chỉ thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get('/', authMiddleware, addressController.getAddresses);

/**
 * @swagger
 * /v1/api/addresses:
 *   post:
 *     summary: Tạo địa chỉ mới
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street
 *               - ward
 *               - district
 *               - city
 *               - address_type
 *             properties:
 *               street:
 *                 type: string
 *                 example: "123 Nguyễn Văn A"
 *               ward:
 *                 type: string
 *                 example: "Phường 1"
 *               district:
 *                 type: string
 *                 example: "Quận 1"
 *               city:
 *                 type: string
 *                 example: "TP Hồ Chí Minh"
 *               country:
 *                 type: string
 *                 default: "Vietnam"
 *               address_type:
 *                 type: string
 *                 enum: [home, office, other]
 *                 example: "home"
 *               is_default:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Địa chỉ được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Thêm địa chỉ mới thành công
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.post('/', authMiddleware, addressController.createAddress);

/**
 * @swagger
 * /v1/api/addresses/{addressId}:
 *   put:
 *     summary: Cập nhật thông tin địa chỉ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               street:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               address_type:
 *                 type: string
 *                 enum: [home, office, other]
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Cập nhật địa chỉ thành công
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       500:
 *         description: Lỗi server
 */
router.put('/:addressId', authMiddleware, addressController.updateAddress);

/**
 * @swagger
 * /v1/api/addresses/{addressId}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ cần xóa
 *     responses:
 *       200:
 *         description: Xóa địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Xóa địa chỉ thành công
 *                 data:
 *                   type: null
 *       400:
 *         description: Không thể xóa địa chỉ mặc định
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       500:
 *         description: Lỗi server
 */
router.delete('/:addressId', authMiddleware, addressController.deleteAddress);

/**
 * @swagger
 * /v1/api/addresses/{addressId}/default:
 *   put:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ cần đặt làm mặc định
 *     responses:
 *       200:
 *         description: Đặt địa chỉ mặc định thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Đặt địa chỉ mặc định thành công
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       500:
 *         description: Lỗi server
 */
router.put('/:addressId/default', authMiddleware, addressController.setDefaultAddress);

module.exports = router;
