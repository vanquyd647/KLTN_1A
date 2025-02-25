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

    updateProductStock: async (stockData) => {
        try {
            let stock;

            // Tìm stock dựa vào stockId hoặc combination của 3 id
            if (stockData.id) {
                stock = await ProductStock.findByPk(stockData.id);
            } else if (stockData.product_id && stockData.size_id && stockData.color_id) {
                stock = await ProductStock.findOne({
                    where: {
                        product_id: stockData.product_id,
                        size_id: stockData.size_id,
                        color_id: stockData.color_id
                    }
                });
            }

            if (!stock) {
                throw new Error('Không tìm thấy thông tin tồn kho');
            }

            // Cập nhật số lượng
            await stock.update({ quantity: stockData.quantity });

            // Cập nhật cache Redis
            await productStockService.invalidateCache();

            await redisClient.del(CACHE_KEY);

            // Lấy lại toàn bộ dữ liệu mới để cập nhật cache
            const allStocks = await ProductStock.findAll({
                attributes: ['id', 'product_id', 'size_id', 'color_id', 'quantity'],
                order: [['id', 'ASC']]
            });

            // Cập nhật cache với dữ liệu mới
            await redisClient.setEx(
                CACHE_KEY,
                CACHE_TTL,
                JSON.stringify(allStocks)
            );

            return stock;
        } catch (error) {
            throw new Error('Lỗi khi cập nhật tồn kho: ' + error.message);
        }
    },

    updateMultipleStocks: async (stockUpdates) => {
        try {
            const results = [];

            for (const update of stockUpdates) {
                let stock;

                // Tìm stock dựa vào stockId hoặc combination
                if (update.id) {
                    stock = await ProductStock.findByPk(update.id);
                } else if (update.product_id && update.size_id && update.color_id) {
                    stock = await ProductStock.findOne({
                        where: {
                            product_id: update.product_id,
                            size_id: update.size_id,
                            color_id: update.color_id
                        }
                    });
                }

                if (stock) {
                    await stock.update({ quantity: update.quantity });
                    results.push(stock);
                }
            }

            // Cập nhật cache sau khi cập nhật tất cả
            await productStockService.invalidateCache();

            await redisClient.del(CACHE_KEY);

            // Lấy và cập nhật lại cache với dữ liệu mới
            const allStocks = await ProductStock.findAll({
                attributes: ['id', 'product_id', 'size_id', 'color_id', 'quantity'],
                order: [['id', 'ASC']]
            });

            await redisClient.setEx(
                CACHE_KEY,
                CACHE_TTL,
                JSON.stringify(allStocks)
            );

            return results;
        } catch (error) {
            throw new Error('Lỗi khi cập nhật nhiều tồn kho: ' + error.message);
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
