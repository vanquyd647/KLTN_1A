const express = require('express');
const router = express.Router();

const { register, verifyOtp, login, loginForAdmin, logout, getUserProfile, refreshToken, updateUserProfile, forgotPassword, resetPassword, getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         gender:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /v1/api/users/register:
 *   post:
 *     summary: Register a new user (OTP verification required)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *               - phone
 *               - gender
 *               - password
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent for verification
 */
router.post('/register', register);

/**
 * @swagger
 * /v1/api/users/verify-otp:
 *   post:
 *     summary: Verify OTP to complete registration
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       201:
 *         description: User successfully registered
 */
router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /v1/api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', login);

/**
 * @swagger
 * /v1/api/users/login-admin:
 *   post:
 *     summary: Admin login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Unauthorized access
 */
router.post('/login-admin', loginForAdmin);

/**
 * @swagger
 * /v1/api/users/logout:
 *   post:
 *     summary: User logout
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *               - userId
 *             properties:
 *               refreshToken:
 *                 type: string
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /v1/api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/profile', authMiddleware, getUserProfile);

/**
 * @swagger
 * /v1/api/users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *               - userId
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login
 *               userId:
 *                 type: integer
 *                 description: The ID of the user
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /v1/api/users/profile:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 description: Tên
 *               lastname:
 *                 type: string
 *                 description: Họ
 *               phone:
 *                 type: string
 *                 description: Số điện thoại (10 số)
 *                 pattern: '^[0-9]{10}$'
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Giới tính
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
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
 *                   example: Cập nhật thông tin thành công!
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.put('/profile', authMiddleware, updateUserProfile);

/**
 * @swagger
 * /v1/api/users/forgot-password:
 *   post:
 *     summary: Gửi OTP để đặt lại mật khẩu
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP đã được gửi thành công
 *       404:
 *         description: Email không tồn tại
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /v1/api/users/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu với OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mật khẩu đã được cập nhật thành công
 *       400:
 *         description: OTP không hợp lệ
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /v1/api/users/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 */
router.get('/admin/users', adminAuthMiddleware, getAllUsers);

/**
 * @swagger
 * /v1/api/users/admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Cannot delete superadmin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/users/:id', adminAuthMiddleware, deleteUser);


/**
 * @swagger
 * /v1/api/users/admin/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin/users', adminAuthMiddleware, createUser);

/**
 * @swagger
 * /v1/api/users/admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/admin/users/:id', adminAuthMiddleware, updateUser);


module.exports = router;
