const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../configs/redisClient'); // Import Redis client

const rateLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args), // Pass Redis client commands
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',
    trustProxy: true
});

module.exports = rateLimiter;
