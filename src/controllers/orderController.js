const OrderService = require('../services/orderService');
const { sequelize } = require('../models');
const ProductStock = require('../models/ProductStock')(sequelize);
const cartService = require('../services/cartService');
const productStockService = require('../services/productStockService');
const { Op } = require('sequelize');
const { createClient } = require('redis');

const redisClient = createClient({
    socket: {
        host: '127.0.0.1',
        port: 6381
    }
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
            // 1. Lấy và chuẩn bị dữ liệu
            const userId = req.userId || null;
            const orderData = { ...req.body, user_id: userId };

            // 2. Validate dữ liệu đầu vào
            if (!OrderController.validateOrderInput(orderData)) {
                return res.status(400).json({
                    code: 400,
                    status: 'error',
                    message: 'Dữ liệu đơn hàng không hợp lệ',
                    errors: {
                        required: ['carrier_id', 'original_price', 'final_price', 'items']
                    }
                });
            }

            // 3. Kiểm tra sản phẩm trùng lặp
            const duplicateCheck = OrderController.checkDuplicateItems(orderData.items);
            if (duplicateCheck.hasDuplicates) {
                return res.status(400).json({
                    code: 400,
                    status: 'error',
                    message: 'Không thể đặt trùng sản phẩm với cùng size và màu'
                });
            }

            // 4. Tạo Redis lock
            await redisClient.set(lockKey, '1', 'EX', 10);

            // 5. Kiểm tra và đồng bộ tồn kho
            const stockCheck = await OrderController.checkAndSyncStock(orderData.items);
            if (!stockCheck.success) {
                await redisClient.del(lockKey);

                // Thêm xử lý chi tiết cho trường hợp hết hàng
                if (stockCheck.data?.outOfStockItems?.length > 0) {
                    return res.status(400).json({
                        code: 400,
                        status: 'error',
                        message: 'Một số sản phẩm đã hết hàng',
                        data: {
                            outOfStockItems: stockCheck.data.outOfStockItems.map(item => ({
                                product_name: item.product_name,
                                size: item.size,
                                color: item.color,
                                requested: item.requested,
                                available: item.available,
                                missing: item.missing
                            }))
                        }
                    });
                }

                // Xử lý trường hợp sản phẩm không tồn tại
                if (stockCheck.data?.notFoundItems?.length > 0) {
                    return res.status(404).json({
                        code: 404,
                        status: 'error',
                        message: 'Một số sản phẩm không tồn tại',
                        data: {
                            notFoundItems: stockCheck.data.notFoundItems.map(item => ({
                                product_name: item.product_name,
                                size: item.size,
                                color: item.color
                            }))
                        }
                    });
                }

                // Trường hợp lỗi khác
                return res.status(stockCheck.code).json({
                    code: stockCheck.code,
                    status: 'error',
                    message: stockCheck.message
                });
            }

            // 6. Trừ số lượng trong Redis
            try {
                await OrderController.decrementStock(orderData.items);
            } catch (error) {
                await redisClient.del(lockKey);
                return res.status(500).json({
                    code: 500,
                    status: 'error',
                    message: 'Lỗi khi cập nhật tồn kho'
                });
            }

            // 7. Tạo đơn hàng
            try {
                const jobId = await OrderService.createOrder(orderData);
                const orderResult = await OrderController.waitForOrderProcessing(jobId);

                if (orderResult.success) {
                    // 8. Xử lý sau khi đặt hàng thành công
                    if (orderData.cart_id) {
                        await OrderController.removeFromCart(orderData);
                    }
                    await productStockService.invalidateCache();
                    await redisClient.del(lockKey);
                    return res.status(201).json({
                        code: 201,
                        status: 'success',
                        message: 'Đặt hàng thành công',
                        data: {
                            order_id: orderResult.orderId,
                            email: orderData.email,
                            amount: orderData.final_price,
                            expires_at: orderResult.expires_at,
                            items: orderData.items.map(item => ({
                                product_name: item.product_name,
                                quantity: item.quantity,
                                price: item.price
                            }))
                        }
                    });
                } else {
                    // 9. Rollback nếu thất bại
                    await OrderController.rollbackStock(orderData.items);
                    await redisClient.del(lockKey);
                    return res.status(500).json({
                        code: 500,
                        status: 'error',
                        message: orderResult.error || 'Lỗi xử lý đơn hàng'
                    });
                }
            } catch (error) {
                // 10. Xử lý lỗi và rollback
                await OrderController.rollbackStock(orderData.items);
                await redisClient.del(lockKey);
                throw error;
            }
        } catch (error) {
            await redisClient.del(lockKey);
            console.error('Lỗi tạo đơn hàng:', error);

            // Xử lý lỗi tồn kho
            if (error.message.includes('Không đủ hàng')) {
                const match = error.message.match(/Còn lại: (\d+), Yêu cầu: (\d+)/);
                return res.status(400).json({
                    code: 400,
                    status: 'error',
                    message: 'Sản phẩm không đủ số lượng trong kho',
                    data: {
                        available: match ? parseInt(match[1]) : 0,
                        requested: match ? parseInt(match[2]) : 0,
                        error: error.message
                    }
                });
            }

            // Xử lý lỗi undefined id
            if (error.message.includes('invalid "undefined" value')) {
                return res.status(400).json({
                    code: 400,
                    status: 'error',
                    message: 'Lỗi xử lý đơn hàng',
                    error: 'Không thể cập nhật trạng thái đơn hàng'
                });
            }

            // Lỗi chung
            return res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Đã có lỗi xảy ra khi xử lý đơn hàng',
                error: process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error'
                    : error.message
            });
        }
    }

    // Các phương thức hỗ trợ
    static validateOrderInput(orderData) {
        return !!(orderData.carrier_id &&
            typeof orderData.original_price === 'number' &&
            typeof orderData.final_price === 'number' &&
            Array.isArray(orderData.items) &&
            orderData.items.length > 0);
    }


    static checkDuplicateItems(items) {
        const uniqueItems = new Set();
        for (const item of items) {
            const key = `${item.product_id}-${item.size_id}-${item.color_id}`;
            if (uniqueItems.has(key)) {
                return { hasDuplicates: true };
            }
            uniqueItems.add(key);
        }
        return { hasDuplicates: false };
    }

    // Trong OrderController.js
    static async checkAndSyncStock(items) {
        try {
            const outOfStockItems = [];
            const notFoundItems = [];

            for (const item of items) {
                // Kiểm tra tham số đầu vào
                if (!item.product_id || !item.size_id || !item.color_id) {
                    throw new Error('Missing required product information');
                }

                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                let redisStock = await redisClient.get(key);

                // Kiểm tra trong MySQL nếu không có trong Redis
                if (redisStock === null) {
                    const mysqlStock = await ProductStock.findOne({
                        where: {
                            product_id: item.product_id,
                            size_id: item.size_id,
                            color_id: item.color_id
                        }
                    });

                    if (!mysqlStock) {
                        notFoundItems.push({
                            product_id: item.product_id,
                            product_name: item.product_name,
                            size: item.size_name,
                            color: item.color_name
                        });
                        continue;
                    }

                    redisStock = mysqlStock.quantity.toString();
                    await redisClient.set(key, redisStock);
                }

                const available = parseInt(redisStock, 10);
                if (isNaN(available) || available < item.quantity) {
                    outOfStockItems.push({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        size: item.size_name,
                        color: item.color_name,
                        requested: item.quantity,
                        available: available || 0
                    });
                    console.error(`❌ Không đủ hàng cho sản phẩm ${item.product_id}-${item.size_id}-${item.color_id}. Còn lại: ${available}, Yêu cầu: ${item.quantity}`);
                }
            }

            if (outOfStockItems.length > 0 || notFoundItems.length > 0) {
                return {
                    success: false,
                    code: 400,
                    message: 'Kiểm tra tồn kho thất bại',
                    data: { outOfStockItems, notFoundItems }
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Lỗi kiểm tra tồn kho:', error);
            throw new Error(`Lỗi kiểm tra tồn kho: ${error.message}`);
        }
    }



    static async decrementStock(items) {
        const operations = items.map(item => {
            const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
            return redisClient.decrBy(key, item.quantity);
        });
        await Promise.all(operations);
    }

    static async rollbackStock(items) {
        const operations = items.map(item => {
            const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
            return redisClient.incrBy(key, item.quantity);
        });
        await Promise.all(operations);
    }

    static async waitForOrderProcessing(jobId, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            const result = await OrderService.getOrderResult(jobId);
            if (result) return result;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return { success: false, error: 'Timeout waiting for order processing' };
    }

    static async removeFromCart(orderData) {
        try {
            const removePromises = orderData.items.map(item =>
                cartService.removeSpecificPendingCartItem(
                    orderData.cart_id,
                    item.product_id,
                    item.size_id,
                    item.color_id
                )
            );
            await Promise.all(removePromises);
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
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

    static async getUserOrders(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await OrderService.getOrdersByUserId(userId, page, limit);

            res.json({
                code: 200,
                status: 'success',
                message: 'Lấy danh sách đơn hàng thành công',
                data: {
                    orders: result.orders,
                    pagination: {
                        total: result.total,
                        currentPage: result.currentPage,
                        totalPages: result.totalPages
                    }
                }
            });

        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Đã có lỗi xảy ra khi lấy danh sách đơn hàng',
                error: error.message
            });
        }
    }

    static async getAllOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                orderId: req.query.orderId,
                customerName: req.query.customerName,
                customerEmail: req.query.customerEmail,
                customerPhone: req.query.customerPhone
            };

            const result = await OrderService.getAllOrders(page, limit, filters);

            res.json({
                code: 200,
                status: 'success',
                message: 'Lấy danh sách đơn hàng thành công',
                data: {
                    orders: result.orders,
                    pagination: {
                        total: result.total,
                        currentPage: result.currentPage,
                        totalPages: result.totalPages
                    }
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Đã có lỗi xảy ra khi lấy danh sách đơn hàng',
                error: error.message
            });
        }
    }

}

module.exports = OrderController;
