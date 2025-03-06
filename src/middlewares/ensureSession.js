const sessionService = require('../services/sessionService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../configs/winston');

const ensureSession = async (req, res, next) => {
    try {
        let sessionId = req.headers['x-session-id'];
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];

        // Nếu không có session_id, tìm session dựa trên IP và User Agent
        if (!sessionId) {
            const existingSession = await sessionService.findExistingSession(
                ipAddress,
                userAgent
            );

            if (existingSession) {
                sessionId = existingSession.session_id;
                req.session = existingSession;
            } else {
                // Chỉ tạo session mới nếu không tìm thấy session nào
                sessionId = uuidv4();
            }
        }

        // Set session ID vào header response
        res.setHeader('x-session-id', sessionId);

        // Nếu chưa có session trong request, tạo hoặc cập nhật
        if (!req.session) {
            const session = await sessionService.createSession({
                session_id: sessionId,
                ip_address: ipAddress,
                user_agent: userAgent,
                status: 'active'
            });
            req.session = session;
        }

        req.sessionId = sessionId;
        next();
    } catch (error) {
        logger.error('Error in ensureSession middleware:', error);
        next(); // Cho phép request tiếp tục ngay cả khi có lỗi
    }
};



module.exports = ensureSession;
