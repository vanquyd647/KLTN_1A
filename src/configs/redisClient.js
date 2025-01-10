require('dotenv').config();
const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
});

client.on('connect', () => {
    console.log('Kết nối Redis thành công!');
});

client.on('error', (err) => {
    console.error('Lỗi kết nối Redis:', err);
});

// Kết nối Redis
(async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error('Không thể kết nối Redis:', err);
    }
})();

module.exports = client;

