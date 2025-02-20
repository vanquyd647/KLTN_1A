require('dotenv').config();
const { createClient } = require('redis');

// 🔥 Kết nối Redis Cache (Không còn dùng mặc định 127.0.0.1:6379)
const redisClient = createClient({
    socket: {
        host: '127.0.0.1', 
        port: 6380
    }
});

redisClient.on('connect', () => console.log('✅ Kết nối Redis Cache thành công!'));
redisClient.on('error', (err) => console.error('❌ Lỗi kết nối Redis Cache:', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis Cache đã sẵn sàng!');
    } catch (error) {
        console.error('❌ Không thể kết nối Redis Cache:', error);
    }
})();

module.exports = redisClient;
