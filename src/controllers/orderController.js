const OrderService = require('../services/orderService');
const { sequelize } = require('../models');
const ProductStock = require('../models/ProductStock')(sequelize);
const { Op } = require('sequelize');
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL2,
    password: process.env.REDIS_PASSWORD2
});

redisClient.on('connect', () => console.log('✅ Kết nối Redis thành công trong OrderController!'));
redisClient.on('error', (err) => console.error('❌ Lỗi kết nối Redis:', err));

(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Không thể kết nối Redis:', error);
    }
})();

class OrderController {
    static async createOrder(req, res) {
        try {
            const userId = req.userId || null;
            const orderData = { ...req.body, user_id: userId };

            // 🔥 Kiểm tra dữ liệu đầu vào
            if (!orderData.carrier_id || !orderData.original_price ||
                !orderData.discounted_price || !orderData.final_price || !orderData.items) {
                return res.status(400).json({ status: 'error', message: 'Dữ liệu đơn hàng không hợp lệ!' });
            }

            // 🔥 Lấy danh sách product_id, size_id, color_id để kiểm tra tồn kho
            const productIds = orderData.items.map(item => item.product_id);
            const sizeIds = orderData.items.map(item => item.size_id);
            const colorIds = orderData.items.map(item => item.color_id);

            // 🔥 Kiểm tra tồn kho từ MySQL
            const stockData = await ProductStock.findAll({
                where: { 
                    product_id: { [Op.in]: productIds },
                    size_id: { [Op.in]: sizeIds },
                    color_id: { [Op.in]: colorIds }
                },
                attributes: ['product_id', 'size_id', 'color_id', 'quantity']
            });

            // 🔥 Xây dựng stockMap từ MySQL
            const stockMap = {};
            for (const stock of stockData) {
                const key = `stock:${stock.product_id}:${stock.size_id}:${stock.color_id}`;
                stockMap[key] = stock.quantity;

                // Nếu Redis chưa có dữ liệu, tải từ MySQL lên trước
                let redisStock = await redisClient.get(key);
                if (redisStock === null || isNaN(parseInt(redisStock, 10))) {
                    await redisClient.set(key, stock.quantity.toString());
                }
            }

            // 🔥 Kiểm tra tồn kho từ Redis trước khi trừ
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                let redisStock = await redisClient.get(key);

                if (redisStock === null || isNaN(parseInt(redisStock, 10))) {
                    return res.status(500).json({ status: 'error', message: `Lỗi dữ liệu tồn kho Redis cho sản phẩm product_id=${item.product_id}` });
                }

                redisStock = parseInt(redisStock, 10);

                if (redisStock < item.quantity) {
                    return res.status(400).json({ status: 'error', message: `Không đủ hàng trong kho cho sản phẩm product_id=${item.product_id}` });
                }
            }

            // 🔥 Nếu đủ hàng, trừ số lượng trong Redis ngay lập tức
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                await redisClient.decrBy(key, item.quantity);
            }

            try {
                // 🔥 Thêm vào hàng đợi
                const jobId = await OrderService.createOrder(orderData);

                // ⏳ Chờ phản hồi từ Worker (tối đa 10 giây)
                let result;
                let attempts = 10;
                while (attempts--) {
                    result = await OrderService.getOrderResult(jobId);
                    if (result) break;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (result && result.success) {
                    return res.status(201).json({ status: 'success', message: 'Đơn hàng đã được xử lý', orderId: result.orderId });
                } else {
                    console.error(`❌ Lỗi xử lý đơn hàng: ${result ? result.error : 'Không có phản hồi từ Worker'}`);

                    // 🔄 Hoàn lại số lượng trong Redis nếu có lỗi
                    for (const item of orderData.items) {
                        const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                        await redisClient.incrBy(key, item.quantity);
                    }

                    return res.status(500).json({ status: 'error', message: result ? result.error : 'Lỗi xử lý đơn hàng' });
                }
            } catch (error) {
                console.error('❌ Lỗi khi gửi đơn hàng vào hàng đợi:', error.message);

                for (const item of orderData.items) {
                    const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                    await redisClient.incrBy(key, item.quantity);
                }

                return res.status(500).json({ status: 'error', message: 'Lỗi xử lý đơn hàng' });
            }

        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    static async getOrderById(req, res) {
        try {
            const order = await OrderService.getOrderById(req.params.orderId);
            if (!order) {
                return res.status(404).json({ status: 'error', message: 'Order not found' });
            }
            res.json({ status: 'success', message: 'Order retrieved successfully', data: order });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    static async updateOrderStatus(req, res) {
        try {
            const success = await OrderService.updateOrderStatus(req.params.orderId, req.body.status);
            if (!success) {
                return res.status(400).json({ status: 'error', message: 'Invalid status update' });
            }
            res.json({ status: 'success', message: 'Order status updated successfully' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    static async cancelExpiredOrders(req, res) {
        try {
            await OrderService.cancelExpiredOrders();
            res.json({ status: 'success', message: 'Expired orders canceled successfully' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    static async completeOrder(req, res) {
        try {
            const success = await OrderService.completeOrder(req.params.orderId);
            if (!success) {
                return res.status(400).json({ status: 'error', message: 'Order could not be completed' });
            }
            res.json({ status: 'success', message: 'Order completed successfully' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    static async deleteOrder(req, res) {
        try {
            const success = await OrderService.deleteOrder(req.params.orderId);
            if (!success) {
                return res.status(404).json({ status: 'error', message: 'Order not found' });
            }
            res.json({ status: 'success', message: 'Order deleted successfully' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
}

module.exports = OrderController;
