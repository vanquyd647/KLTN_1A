const logger = require('../configs/winston');

const errorHandler = (err, req, res, next) => {
    logger.error(`❌ [${req.method}] ${req.originalUrl} - ${err.message}`, { error: err });
    res.status(500).json({ message: 'Internal Server Error' });
};

module.exports = errorHandler;
