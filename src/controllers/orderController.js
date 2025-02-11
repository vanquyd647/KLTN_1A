const OrderService = require('../services/orderService');
const { sequelize } = require('../models');
const ProductStock = require('../models/ProductStock')(sequelize);
const cartService = require('../services/cartService');
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
        const lockKey = `order_lock:${Date.now()}`;
        try {
            const userId = req.userId || null;
            const orderData = { ...req.body, user_id: userId };
            // Validation đầu vào
            if (!orderData.carrier_id || !orderData.original_price ||
                !orderData.discounted_price || !orderData.final_price || !orderData.items) {
                return res.status(400).json({
                    code: 400,
                    status: 'error',
                    message: 'Dữ liệu đơn hàng không hợp lệ!'
                });
            }

            // Kiểm tra items trùng lặp
            const uniqueItems = new Set();
            for (const item of orderData.items) {
                const key = `${item.product_id}-${item.size_id}-${item.color_id}`;
                if (uniqueItems.has(key)) {
                    return res.status(400).json({
                        code: 400,
                        status: 'error',
                        message: 'Không thể đặt trùng sản phẩm với cùng size và màu'
                    });
                }
                uniqueItems.add(key);
            }

            // Lock để tránh race condition
            await redisClient.set(lockKey, '1', 'EX', 10); // Lock 10s

            const productIds = orderData.items.map(item => item.product_id);
            const sizeIds = orderData.items.map(item => item.size_id);
            const colorIds = orderData.items.map(item => item.color_id);

            // Kiểm tra tồn kho MySQL
            const stockData = await ProductStock.findAll({
                where: {
                    product_id: { [Op.in]: productIds },
                    size_id: { [Op.in]: sizeIds },
                    color_id: { [Op.in]: colorIds }
                },
                attributes: ['product_id', 'size_id', 'color_id', 'quantity']
            });

            // Xây dựng stockMap
            const stockMap = {};
            for (const stock of stockData) {
                const key = `stock:${stock.product_id}:${stock.size_id}:${stock.color_id}`;
                stockMap[key] = stock.quantity;

                // Sync Redis với MySQL
                let redisStock = await redisClient.get(key);
                if (redisStock === null || isNaN(parseInt(redisStock, 10))) {
                    await redisClient.set(key, stock.quantity.toString());
                }
            }

            // Kiểm tra tồn kho Redis
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                let redisStock = await redisClient.get(key);

                if (redisStock === null || isNaN(parseInt(redisStock, 10))) {
                    await redisClient.del(lockKey);
                    return res.status(500).json({
                        code: 500,
                        status: 'error',
                        message: `Lỗi dữ liệu tồn kho Redis cho sản phẩm product_id=${item.product_id}`
                    });
                }

                redisStock = parseInt(redisStock, 10);
                if (redisStock < item.quantity) {
                    await redisClient.del(lockKey);
                    return res.status(400).json({
                        code: 400,
                        status: 'error',
                        message: `Không đủ hàng trong kho cho sản phẩm product_id=${item.product_id}`
                    });
                }
            }

            // Trừ số lượng trong Redis
            const redisOps = [];
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                redisOps.push(redisClient.decrBy(key, item.quantity));
            }
            await Promise.all(redisOps);

            try {
                const jobId = await OrderService.createOrder(orderData);

                // Chờ kết quả xử lý
                let result;
                let attempts = 10;
                while (attempts--) {
                    result = await OrderService.getOrderResult(jobId);
                    if (result) break;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (result && result.success) {
                    // Xóa sản phẩm đã đặt khỏi giỏ hàng
                    if (orderData.cart_id) { // Đảm bảo có cart_id
                        try {
                            console.log('Cart ID from order data:', orderData.cart_id);

                            const cartItemsToRemove = orderData.items.map(item => ({
                                cart_id: orderData.cart_id, // Sử dụng cart_id từ orderData
                                productId: item.product_id,
                                sizeId: item.size_id,
                                colorId: item.color_id
                            }));

                            console.log('Items to remove:', cartItemsToRemove);

                            const removeResults = await Promise.all(
                                cartItemsToRemove.map(item =>
                                    cartService.removeSpecificPendingCartItem(
                                        item.cart_id,
                                        item.productId,
                                        item.sizeId,
                                        item.colorId
                                    )
                                )
                            );

                            console.log('Remove results:', removeResults);
                        } catch (error) {
                            console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
                            // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo đơn hàng
                        }
                    }

                    await redisClient.del(lockKey);
                    return res.status(201).json({ 
                        code: 201,
                        status: 'success', 
                        message: 'Đơn hàng đã được xử lý', 
                        orderId: result.orderId 
                    });
                } else {
                    // Rollback Redis nếu có lỗi
                    const rollbackOps = [];
                    for (const item of orderData.items) {
                        const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                        rollbackOps.push(redisClient.incrBy(key, item.quantity));
                    }
                    await Promise.all(rollbackOps);

                    await redisClient.del(lockKey);
                    return res.status(500).json({
                        code: 500,
                        status: 'error',
                        message: result ? result.error : 'Lỗi xử lý đơn hàng'
                    });
                }
            } catch (error) {
                // Rollback Redis khi có lỗi
                const rollbackOps = [];
                for (const item of orderData.items) {
                    const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                    rollbackOps.push(redisClient.incrBy(key, item.quantity));
                }
                await Promise.all(rollbackOps);

                await redisClient.del(lockKey);
                return res.status(500).json({
                    code: 500,
                    status: 'error',
                    message: 'Lỗi xử lý đơn hàng'
                });
            }

        } catch (error) {
            await redisClient.del(lockKey);
            res.status(500).json({
                code: 500,
                status: 'error',
                message: error.message
            });
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
