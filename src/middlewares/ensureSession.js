const sessionService = require('../services/sessionService');
const { v4: uuidv4 } = require('uuid');

const ensureSession = async (req, res, next) => {
    let sessionId = req.headers['x-session-id']; // Check session ID in request header

    if (!sessionId) {
        // Generate a new session ID if not present
        sessionId = uuidv4();

        // Create a new session in the database
        await sessionService.createSession({
            session_id: sessionId,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            status: 'active',
        });

        // Add session ID to the response header
        res.setHeader('x-session-id', sessionId);
    } else {
        // Check if session exists in the database
        const sessionExists = await sessionService.getSessionById(sessionId);
        if (!sessionExists) {
            // Create a new session if the session ID is invalid
            await sessionService.createSession({
                session_id: sessionId,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                status: 'active',
            });
        }
    }

    // Attach session ID to the request for further use
    req.sessionId = sessionId;

    next();
};

module.exports = ensureSession;
