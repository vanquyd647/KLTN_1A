"use strict";

const UserService = require('../services/userService');
const TokenService = require('../services/tokenService');
const OtpService = require('../services/otpService');
const EmailService = require('../services/emailService');
const redisClient = require('../configs/redisClient');

const userStore = new Map();

// Đăng ký người dùng mới (gửi OTP và lưu tạm thông tin)
const register = async (req, res) => {
    try {
        const { firstname, lastname, email, phone, gender, password, role } = req.body;

        if (!firstname || !lastname || !email || !phone || !gender || !password) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Tất cả các trường thông tin đều bắt buộc.',
                data: null,
            });
        }

        const userRole = role || 'customer';

        const otp = OtpService.generateOtp();
        OtpService.saveOtp(email, otp);

        userStore.set(email, { firstname, lastname, email, phone, gender, password, role: userRole });

        await EmailService.sendOtpEmail(email, otp);

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'OTP đã được gửi đến email của bạn. Vui lòng xác thực để hoàn tất đăng ký.',
            data: null
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error.message);
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message,
            data: null
        });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const isValidOtp = OtpService.verifyOtp(email, otp);
        if (!isValidOtp) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'OTP không hợp lệ hoặc đã hết hạn.',
                data: null
            });
        }

        const userData = userStore.get(email);
        if (!userData) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Thông tin người dùng không tồn tại hoặc đã hết hạn.',
                data: null
            });
        }

        const user = await UserService.createUser(userData);

        OtpService.clearOtp(email);
        userStore.delete(email);

        res.status(201).json({
            status: 'success',
            code: 201,
            message: 'Đăng ký thành công!',
            data: null,
            user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: `Lỗi xác thực OTP: ${error.message}`,
            data: null
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserService.authenticateUser(email, password);

        const payload = { userId: user.id };
        const { accessToken, refreshToken } = TokenService.generateTokens(payload);

        await TokenService.saveToken(user.id, refreshToken);

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Đăng nhập thành công!',
            data: { accessToken, refreshToken },
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            code: 400,
            message: error.message,
            data: null
        });
    }
};

const loginForAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserService.authenticateUser(email, password);

        const roleNames = await UserService.getUserRoles(user.id);

        if (!roleNames.includes('admin') && !roleNames.includes('superadmin')) {
            return res.status(401).json({
                status: 'error',
                code: 401,
                message: 'Bạn không có quyền truy cập vào hệ thống quản trị.',
                data: null,
            });
        }

        const role = roleNames.includes('superadmin') ? 'superadmin' : 'admin';

        const payload = { userId: user.id, role };
        const { accessToken, refreshToken } = TokenService.generateTokens(payload);

        await TokenService.saveToken(user.id, refreshToken);

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Đăng nhập quản trị thành công!',
            data: {
                accessToken,
                refreshToken,
                role,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            code: 400,
            message: error.message,
            data: null,
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { get_refreshToken } = req.body;

        const tokens = await TokenService.refreshTokens(get_refreshToken);
        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Refresh token thành công!',
            data: tokens,
            user: null
        });
    } catch (error) {
        res.status(403).json({
            status: 'error',
            code: 403,
            message: error.message,
            data: null,
            user: null
        });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        await TokenService.removeToken(refreshToken);

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Đăng xuất thành công!',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message,
            data: null
        });
    }
};

const getUserProfile = async (req, res) => {
    const userId = req.userId;

    try {
        const cachedProfile = await redisClient.get(`user:${userId}:profile`);

        if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy thông tin người dùng từ cache thành công!',
                data: parsedProfile,
            });
        }

        const user = await UserService.getUserById(userId);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Người dùng không tồn tại!',
                data: null,
            });
        }

        const userProfile = {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };

        await redisClient.set(`user:${userId}:profile`, JSON.stringify(userProfile), { EX: 3600 });

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy thông tin người dùng thành công!',
            data: userProfile,
        });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi hệ thống, vui lòng thử lại sau!',
            data: null,
        });
    }
};

module.exports = {
    register,
    verifyOtp,
    login,
    loginForAdmin,
    refreshToken,
    logout,
    getUserProfile
};
