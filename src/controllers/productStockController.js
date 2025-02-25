const productStockService = require('../services/productStockService');
const redisClient = require('../configs/redisClient');

class ProductStockController {
    async getProductStocks(req, res) {
        try {
            // Kiểm tra Redis connection
            if (!redisClient.isReady) {
                console.warn('⚠️ Redis không khả dụng, sẽ query trực tiếp từ DB');
            }

            const stocks = await productStockService.getProductStocks();
            res.json({
                success: true,
                data: stocks,
                cached: redisClient.isReady && await redisClient.exists('product_stocks')
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async refreshCache(req, res) {
        try {
            await productStockService.invalidateCache();
            const stocks = await productStockService.getProductStocks();
            res.json({
                success: true,
                message: 'Cache đã được làm mới',
                data: stocks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateStock(req, res) {
        try {
            const stockId = req.params.id;
            const stockData = req.body;

            // Validate dữ liệu đầu vào
            if (typeof stockData.quantity !== 'number' || stockData.quantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng không hợp lệ'
                });
            }

            // Thêm id từ params vào stockData
            const updatedStock = await productStockService.updateProductStock({
                id: stockId,
                ...stockData
            });

            res.json({
                success: true,
                message: 'Cập nhật tồn kho thành công',
                data: updatedStock
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

}

module.exports = new ProductStockController();
