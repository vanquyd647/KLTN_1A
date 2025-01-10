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


// Đăng ký người dùng mới
router.post('/register', UserController.register);

// Xác thực OTP và hoàn tất đăng ký
router.post('/verify-otp', UserController.verifyOtp);

// Đăng nhập người dùng
router.post('/login', UserController.login);

// Đăng xuất người dùng
router.post('/logout', authMiddleware, UserController.logout);

// Lấy thông tin người dùng (cần đăng nhập)
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




module.exports = router; // Use the user routes for all routes starting with /api/users
