"use strict";

const jwt = require("jsonwebtoken");
const { Token } = require("../models"); // Import model từ Sequelize
const logger = require('../configs/winston');
require("dotenv").config(); // Đọc biến môi trường từ .env

const tokenService = {
    /**
     * Tạo Access Token và Refresh Token
     * @param {Object} payload - Dữ liệu cần mã hóa trong token
     * @returns {Object} - Access Token và Refresh Token
     */
    generateTokens(payload) {
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "3600s" }); // Hết hạn sau 1 giờ
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" }); // Hết hạn sau 7 ngày

        return { accessToken, refreshToken };
    },

    /**
     * Lưu Refresh Token vào cơ sở dữ liệu
     * @param {number} userId - ID của người dùng
     * @param {string} refreshToken - Refresh Token cần lưu
     * @returns {Object} - Dữ liệu token được lưu
     */
    async saveToken(userId, refreshToken) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Tính thời gian hết hạn (7 ngày)

        // Lưu token, nếu đã tồn tại thì cập nhật
        const token = await Token.upsert({
            user_id: userId,
            refresh_token: refreshToken,
            expires_at: expiresAt,
        });

        return token;
    },

    /**
     * Kiểm tra tính hợp lệ của một token
     * @param {string} token - Token cần xác minh
     * @param {string} secret - Khóa bí mật để xác minh
     * @returns {Object|null} - Dữ liệu mã hóa nếu token hợp lệ, hoặc null nếu không hợp lệ
     */
    verifyToken(token, secret) {
        try {
            return jwt.verify(token, secret); // Xác minh token
        } catch (err) {
            logger.error("Lỗi xác minh token:", { error: err.message });
            return null; // Trả về null nếu token không hợp lệ
        }
    },

    /**
     * Xóa Refresh Token khỏi cơ sở dữ liệu
     * @param {string} refreshToken - Token cần xóa
     * @returns {number} - Số lượng bản ghi bị xóa
     */
    async removeToken(refreshToken) {
        return await Token.destroy({ where: { refresh_token: refreshToken } });
    },

    /**
     * Tìm Refresh Token trong cơ sở dữ liệu
     * @param {string} refreshToken - Refresh Token cần tìm
     * @returns {Object|null} - Dữ liệu token hoặc null nếu không tìm thấy
     */
    async findToken(refreshToken) {
        return await Token.findOne({ where: { refresh_token: refreshToken } });
    },

    /**
     * Xác minh Refresh Token
     * @param {string} refreshToken - Refresh Token cần xác minh
     * @returns {Object} - Dữ liệu của token nếu hợp lệ
     * @throws {Error} - Nếu token không hợp lệ hoặc đã hết hạn
     */
    async verifyRefreshToken(refreshToken) {
        // Tìm Refresh Token trong cơ sở dữ liệu
        const tokenData = await tokenService.findToken(refreshToken);
        if (!tokenData) {
            logger.error("Refresh Token không tồn tại");
            throw new Error("Refresh Token không tồn tại");
        }

        // Kiểm tra thời gian hết hạn của Refresh Token
        if (new Date() > tokenData.expires_at) {
            throw new Error("Refresh Token đã hết hạn");
        }

        // Xác minh tính hợp lệ của Refresh Token
        const userData = tokenService.verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!userData) {
            logger.error("Refresh Token không hợp lệ");
            throw new Error("Refresh Token không hợp lệ");
        }

        return userData;
    },

    /**
     * Cấp phát Access Token mới từ Refresh Token
     * @param {string} refreshToken - Refresh Token cũ
     * @returns {Object} - Access Token mới và Refresh Token mới
     */
    async refreshTokens(refreshToken) {
        // Xác minh Refresh Token
        const userData = await tokenService.verifyRefreshToken(refreshToken);

        // Tạo Access Token và Refresh Token mới
        const payload = { userId: userData.userId };
        const { accessToken, refreshToken: newRefreshToken } = tokenService.generateTokens(payload);

        // Xóa Refresh Token cũ và lưu token mới
        await tokenService.removeToken(refreshToken);
        await tokenService.saveToken(userData.userId, newRefreshToken);

        return { accessToken, refreshToken: newRefreshToken };
    }
};

// Export all functions inside an object
module.exports = tokenService;
