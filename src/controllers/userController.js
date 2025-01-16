const UserService = require('../services/userService');
const TokenService = require('../services/tokenService');
const OtpService = require('../services/otpService');
const EmailService = require('../services/emailService');
const redisClient = require('../configs/redisClient');

const userStore = new Map();

class UserController {
    // Đăng ký người dùng mới (gửi OTP và lưu tạm thông tin)
    static async register(req, res) {
        try {
            const { firstname, lastname, email, phone, gender, password } = req.body;

            // Kiểm tra dữ liệu bắt buộc
            if (!firstname || !lastname || !email || !phone || !gender || !password) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Tất cả các trường thông tin đều bắt buộc.',
                    data: null,
                });
            }

            // Kiểm tra xem email đã tồn tại trong bộ nhớ tạm
            if (userStore.has(email)) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Email này đang chờ xác thực OTP. Vui lòng đợi trước khi đăng ký lại.',
                    data: null
                });
            }

            // Tạo OTP và lưu vào bộ nhớ tạm
            const otp = OtpService.generateOtp();
            OtpService.saveOtp(email, otp);

            // Lưu tạm thông tin người dùng vào bộ nhớ (chưa lưu vào DB)
            userStore.set(email, { firstname, lastname, email, phone, gender, password });

            // Gửi OTP qua email
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
    }

    static async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;

            // Kiểm tra OTP
            const isValidOtp = OtpService.verifyOtp(email, otp);
            if (!isValidOtp) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'OTP không hợp lệ hoặc đã hết hạn.',
                    data: null
                });
            }

            // Kiểm tra xem thông tin người dùng có trong bộ nhớ tạm không
            const userData = userStore.get(email);
            if (!userData) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Thông tin người dùng không tồn tại hoặc đã hết hạn.',
                    data: null
                });
            }

            // Lưu thông tin người dùng vào cơ sở dữ liệu
            const user = await UserService.createUser(userData);

            // Xóa OTP và thông tin tạm thời
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
    }

    // Đăng nhập người dùng
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Xác thực người dùng
            const user = await UserService.authenticateUser(email, password);

            // Tạo token
            const payload = { userId: user.id };
            const { accessToken, refreshToken } = TokenService.generateTokens(payload);

            // Lưu refresh token vào DB
            await TokenService.saveToken(user.id, refreshToken);

            res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Đăng nhập thành công!',
                data: { accessToken, refreshToken, userId: user.id },
                user
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                code: 400,
                message: error.message,
                data: null
            });
        }
    }

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const { get_refreshToken } = req.body;

            // Cấp phát token mới
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
    }

    // Đăng xuất người dùng
    static async logout(req, res) {
        try {
            const { refreshToken, userId } = req.body;

            // Xóa refresh token khỏi DB
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
    }

    // Lấy thông tin người dùng
    static async getUserProfile(req, res) {
        const userId = req.userId;

        try {
            // Kiểm tra dữ liệu người dùng trong Redis cache
            const cachedProfile = await redisClient.get(`user:${userId}:profile`);

            if (cachedProfile) {
                // Dữ liệu tồn tại trong cache
                const parsedProfile = JSON.parse(cachedProfile);
                return res.status(200).json({
                    status: 'success',
                    code: 200,
                    message: 'Lấy thông tin người dùng từ cache thành công!',
                    data: parsedProfile, // Dữ liệu đã parse
                });
            }

            // Nếu không có trong cache, lấy từ database
            const user = await UserService.getUserById(userId);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    code: 404,
                    message: 'Người dùng không tồn tại!',
                    data: null,
                });
            }

            // Tạo dữ liệu người dùng (loại bỏ các thông tin nhạy cảm)
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

            // Lưu thông tin vào Redis cache với thời gian hết hạn 3600 giây (1 giờ)
            await redisClient.set(`user:${userId}:profile`, JSON.stringify(userProfile), {
                EX: 3600
            });

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
    }

}

module.exports = UserController;
