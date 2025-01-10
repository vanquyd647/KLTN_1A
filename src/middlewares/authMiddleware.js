const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            code: 401,
            message: 'Unauthorized: Token is missing or invalid.',
        });
    }

    const token = authHeader.split(' ')[1]; // Tách token từ "Bearer <token>"

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Giải mã Access Token
        req.userId = decoded.userId; // Lưu userId từ payload
        next(); // Tiếp tục xử lý
    } catch (error) {
        return res.status(403).json({
            status: 'error',
            code: 403,
            message: 'Forbidden: Invalid or expired token.',
        });
    }
};

module.exports = authenticateToken;
