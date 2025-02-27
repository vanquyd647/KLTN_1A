// adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const userService = require('../services/userService'); // Sửa cách import
const logger = require('../configs/winston');

const adminAuthMiddleware = async (req, res, next) => {
    try {
        // Kiểm tra header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                code: 401,
                message: 'Unauthorized: Missing or invalid token format',
            });
        }

        // Lấy token
        const token = authHeader.split(' ')[1];

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.userId = decoded.userId;

            // Kiểm tra roles của user - Sửa cách gọi hàm
            const roles = await userService.getUserRoles(decoded.userId);

            // Chỉ cho phép admin và superadmin
            if (!roles.includes('admin') && !roles.includes('superadmin')) {
                return res.status(403).json({
                    status: 'error',
                    code: 403,
                    message: 'Forbidden: Insufficient permissions',
                });
            }

            // Lưu thông tin role vào request để sử dụng sau này nếu cần
            req.userRoles = roles;
            next();

        } catch (jwtError) {
            logger.error(`JWT verification failed: ${jwtError.message}`);
            return res.status(403).json({
                status: 'error',
                code: 403,
                message: 'Forbidden: Invalid or expired token',
            });
        }

    } catch (error) {
        logger.error(`Admin authentication error: ${error.message}`);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Internal server error during authentication',
        });
    }
};

module.exports = adminAuthMiddleware;
