const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');  // Optional, if authentication is needed // Import Redis client
const rateLimiter = require('../middlewares/rateLimiter');  // Import rate limiting middleware
const ensureSession = require('../middlewares/ensureSession'); // Import ensureSession middleware

router.use(ensureSession); // Apply ensureSession middleware to all user routes
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
 *               email:
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
// Route lấy thông tin người dùng
router.get('/profile', authMiddleware, UserController.getUserProfile);

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


router.post('/login-admin', UserController.loginForAdmin);


module.exports = router; // Use the user routes for all routes starting with /api/users
