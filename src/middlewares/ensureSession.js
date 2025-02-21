const sessionService = require('../services/sessionService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../configs/winston');

const ensureSession = async (req, res, next) => {
    try {
        let sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            sessionId = uuidv4();
            res.setHeader('x-session-id', sessionId);
        }

        // Sử dụng createSession đã được cải tiến để handle cả create và update
        const session = await sessionService.createSession({
            session_id: sessionId,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            status: 'active'
        });

        // Gán session vào request để sử dụng ở middleware khác
        req.sessionId = sessionId;
        req.session = session;

        next();
    } catch (error) {
        // Cho phép request tiếp tục
        next();
    }
};


module.exports = ensureSession;
