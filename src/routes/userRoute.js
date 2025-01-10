const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');  // Optional, if authentication is needed
const redisClient = require('../configs/redisClient');  // Import Redis client
const rateLimiter = require('../middlewares/rateLimiter');  // Import rate limiting middleware

// Apply rate limiting to specific routes (for example, register and login)
router.use('/register', rateLimiter);
router.use('/login', rateLimiter);
router.use('/verify-otp', rateLimiter);
router.use('/profile', rateLimiter);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         gender:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */


// Đăng ký người dùng mới
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - email
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful, OTP sent
 */
router.post('/register', UserController.register);

// Xác thực OTP và hoàn tất đăng ký
/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     tags: [Users]
 *     summary: Verify OTP for registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', UserController.verifyOtp);

// Đăng nhập người dùng
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [Users]
 *     summary: User login
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
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', UserController.login);

// Đăng xuất người dùng
/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     tags: [Users]
 *     summary: User logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authMiddleware, UserController.logout);

// Lấy thông tin người dùng (cần đăng nhập)
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
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
router.get('/profile', authMiddleware, async (req, res) => {
    const userId = req.userId;

    try {
        // Kiểm tra dữ liệu người dùng đã lưu trong cache
        const cachedProfile = await redisClient.get(`user:${userId}:profile`);

        // Nếu tìm thấy dữ liệu trong cache, trả về dữ liệu
        if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy thông tin người dùng thành công!',
                data: parsedProfile,  // Trả về dữ liệu đã được parse trong trường "data"
            });
        }

        // Nếu không có dữ liệu trong cache, lấy dữ liệu từ cơ sở dữ liệu
        const user = await UserController.getUser(req, res);

        // Kiểm tra nếu người dùng không tồn tại
        if (!user) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Người dùng không tồn tại!',
                data: null
            });
        }

        // Lưu thông tin người dùng vào cache với thời gian hết hạn là 3600 giây (1 giờ)
        await redisClient.set(`user:${userId}:profile`, JSON.stringify(user), 'EX', 3600);

        // Trả về dữ liệu người dùng
        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy thông tin người dùng thành công!',
            data: user
        });

    } catch (err) {
        console.error('Error retrieving user profile:', err);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Internal Server Error',
            data: null
        });
    }
});

/**
 * @swagger
 * /api/users/refresh-token:
 *   post:
 *     tags: [Users]
 *     summary: Refresh access token using refresh token
 *     description: Generate new access token using valid refresh token
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
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', UserController.refreshToken);


module.exports = router; // Use the user routes for all routes starting with /api/users
