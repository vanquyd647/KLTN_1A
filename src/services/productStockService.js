const { ProductStock } = require('../models');
const redisClient = require('../configs/redisClient');

const CACHE_KEY = 'product_stocks';
const CACHE_TTL = 300; // 5 phút

const productStockService = {
    getProductStocks: async () => {
        try {
            // Thử lấy từ cache trước
            const cachedStocks = await redisClient.get(CACHE_KEY);
            if (cachedStocks) {
                return JSON.parse(cachedStocks);
            }

            // Nếu không có trong cache, query từ DB
            const stocks = await ProductStock.findAll({
                attributes: ['id', 'product_id', 'size_id', 'color_id', 'quantity'],
                order: [['id', 'ASC']]
            });

            // Lưu vào cache
            await redisClient.setEx(
                CACHE_KEY,
                CACHE_TTL,
                JSON.stringify(stocks)
            );

            return stocks;
        } catch (error) {
            throw new Error('Lỗi khi lấy danh sách tồn kho: ' + error.message);
        }
    },

    invalidateCache: async () => {
        try {
            await redisClient.del(CACHE_KEY);
        } catch (error) {
            console.error('Lỗi khi xóa cache:', error);
        }
    }
};

module.exports = productStockService;
