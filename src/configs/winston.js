const winston = require('winston');
const path = require('path');

// Định nghĩa định dạng log
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

// Cấu hình Winston logger
const logger = winston.createLogger({
    level: 'info', // Mức độ log (info, warn, error, debug)
    format: logFormat,
    transports: [
        new winston.transports.Console(), // Hiển thị log trên console
        new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }), // Log lỗi
        new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }) // Log toàn bộ
    ]
});

module.exports = logger;
