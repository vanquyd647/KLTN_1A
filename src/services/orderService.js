const { Queue } = require('bullmq');
const { createClient } = require('redis');
const { sequelize } = require('../models');
const Order = require('../models/Order')(sequelize);
const OrderDetail = require('../models/OrderDetails')(sequelize);
const OrderItem = require('../models/OrderItem')(sequelize);
const ProductStock = require('../models/ProductStock')(sequelize);
const logger = require('../configs/winston');

const { Op } = require('sequelize');
require('dotenv').config();

// 🔥 Kết nối Redis
const redisQueueClient = createClient({
    url: process.env.REDIS_URL2,
    password: process.env.REDIS_PASSWORD2
});

redisQueueClient.on('connect', () => console.log('✅ Kết nối Redis Queue thành công!'));
redisQueueClient.on('error', (err) => logger.error(`❌ Lỗi Redis Queue: ${err.message}`, { error: err }));


(async () => {
    try {
        await redisQueueClient.connect();
    } catch (error) {
        console.error('❌ Không thể kết nối Redis Queue:', error);
        logger.error('❌ Không thể kết nối Redis Queue:', { error });
    }
})();

// 🔥 Khởi tạo hàng đợi đơn hàng
const orderQueue = new Queue('orderQueue', {
    connection: {
        host: process.env.REDIS_URL2.split('//')[1].split(':')[0],
        port: process.env.REDIS_URL2.split(':')[2] || 6379,
        password: process.env.REDIS_PASSWORD2
    }
});

const OrderService = {
    // 📌 Thêm đơn hàng vào hàng đợi
    createOrder: async (orderData) => {
        if (!orderData.carrier_id || !orderData.original_price ||
            !orderData.discounted_price || !orderData.final_price || !orderData.items) {
            logger.error('❌ Thiếu thông tin quan trọng trong đơn hàng!', { orderData });
            throw new Error("Thiếu thông tin quan trọng trong đơn hàng!");
        }

        const job = await orderQueue.add('processOrder', orderData, {
            removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });

        return job.id;
    },

    getOrderResult: async (jobId) => {
        const result = await redisQueueClient.get(`orderResult:${jobId}`);
        return result ? JSON.parse(result) : null;
    },

    processOrder: async (orderData) => {
        const t = await sequelize.transaction();
        try {
            console.log('Received order data:', orderData); // Debug log

            // Lọc bỏ trùng lặp trong mảng ID trước khi query
            const productIds = [...new Set(orderData.items.map(item => item.product_id))];
            const sizeIds = [...new Set(orderData.items.map(item => item.size_id))];
            const colorIds = [...new Set(orderData.items.map(item => item.color_id))];

            console.log('Unique IDs for query:', { productIds, sizeIds, colorIds }); // Debug log

            // Query stock data với các ID đã được lọc trùng
            const stockData = await ProductStock.findAll({
                where: {
                    [Op.and]: [
                        { product_id: { [Op.in]: productIds } },
                        { size_id: { [Op.in]: sizeIds } },
                        { color_id: { [Op.in]: colorIds } }
                    ]
                },
                transaction: t,
                lock: true
            });

            console.log('Found stock data:', stockData); // Debug log

            // Tạo map để kiểm tra stock
            const stockMap = {};
            stockData.forEach(stock => {
                const key = `${stock.product_id}-${stock.size_id}-${stock.color_id}`;
                stockMap[key] = stock.quantity;
            });

            // Kiểm tra stock cho từng item
            for (const item of orderData.items) {
                const key = `${item.product_id}-${item.size_id}-${item.color_id}`;
                const availableStock = stockMap[key];

                console.log('Checking stock for:', {
                    key,
                    requestedQuantity: item.quantity,
                    availableStock
                }); // Debug log

                if (typeof availableStock === 'undefined') {
                    logger.error(`Không tìm thấy stock cho sản phẩm: ${key}`);
                    throw new Error(`Không tìm thấy stock cho sản phẩm: ${key}`);
                }

                if (availableStock < item.quantity) {
                    logger.error(`Không đủ hàng trong kho cho sản phẩm ${key}. Còn lại: ${availableStock}, Yêu cầu: ${item.quantity}`);
                    throw new Error(`Không đủ hàng trong kho cho sản phẩm ${key}. Còn lại: ${availableStock}, Yêu cầu: ${item.quantity}`);
                }
            }

            // Tạo đơn hàng
            const order = await Order.create({
                user_id: orderData.user_id,
                carrier_id: orderData.carrier_id,
                discount_code: orderData.discount_code,
                discount_amount: orderData.discount_amount || 0,
                original_price: orderData.original_price,
                discounted_price: orderData.discounted_price,
                final_price: orderData.final_price,
                payment_method: orderData.payment_method,
                status: 'pending',
                expires_at: new Date(Date.now() + 10 * 60 * 1000)
            }, { transaction: t });

            // Tạo order items và cập nhật stock
            for (const item of orderData.items) {
                await OrderItem.create({
                    order_id: order.id,
                    product_id: item.product_id,
                    size_id: item.size_id,
                    color_id: item.color_id,
                    quantity: item.quantity,
                    price: item.price,
                    reserved: true
                }, { transaction: t });

                // Cập nhật stock
                await ProductStock.update(
                    {
                        quantity: sequelize.literal(`quantity - ${item.quantity}`)
                    },
                    {
                        where: {
                            product_id: item.product_id,
                            size_id: item.size_id,
                            color_id: item.color_id,
                            quantity: { [Op.gte]: item.quantity }
                        },
                        transaction: t
                    }
                );
            }

            await t.commit();
            return order;

        } catch (error) {
            await t.rollback();
            logger.error(`❌ Lỗi khi xử lý đơn hàng: ${error.message}`, { error });
            console.error('Error in processOrder:', error);
            throw error;
        }
    },

    // 📌 Cập nhật trạng thái đơn hàng
    updateOrderStatus: async (orderId, status) => {
        const allowedStatuses = ['pending', 'completed', 'canceled', 'failed', 'in_payment', 'in_progress'];
        if (!allowedStatuses.includes(status)) {
            logger.error('Trạng thái không hợp lệ');
            throw new Error('Invalid status');
        }

        const [updated] = await Order.update({ status }, { where: { id: orderId } });

        return updated > 0;
    },

    // 📌 Hủy đơn hàng hết hạn và trả lại stock
    cancelExpiredOrders: async () => {
        const expiredOrders = await Order.findAll({
            where: {
                status: 'pending',
                expires_at: { [Op.lt]: new Date() }
            }
        });

        for (const order of expiredOrders) {
            const orderItems = await OrderItem.findAll({ where: { order_id: order.id } });

            for (const item of orderItems) {
                const stockKey = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;

                // 🔥 Trả lại số lượng hàng đã giữ vào Redis
                await redisQueueClient.incrBy(stockKey, item.quantity);

                // 🔥 Cập nhật lại Database (trả hàng về kho)
                await ProductStock.update(
                    { quantity: sequelize.literal(`quantity + ${item.quantity}`) },
                    {
                        where: {
                            product_id: item.product_id,
                            size_id: item.size_id,
                            color_id: item.color_id
                        }
                    }
                );
            }

            // Cập nhật trạng thái đơn hàng là "canceled"
            await Order.update({ status: 'canceled' }, { where: { id: order.id } });
        }
    },

    getOrderById: async (orderId) => {
        return await Order.findByPk(orderId, {
            include: [
                { model: OrderDetail },
                { model: OrderItem }
            ]
        });
    },

    updateOrderStatus: async (orderId, status) => {
        const allowedStatuses = ['pending', 'completed', 'canceled', 'failed', 'in_payment', 'in_progress'];
        if (!allowedStatuses.includes(status)) {
            logger.error('Trạng thái không hợp lệ');
            throw new Error('Invalid status');
        }

        const [updated] = await Order.update({ status }, {
            where: { id: orderId }
        });

        return updated > 0;
    },

    completeOrder: async (orderId) => {
        const [updated] = await Order.update({ status: 'completed' }, {
            where: { id: orderId, status: 'in_payment' }
        });

        return updated > 0;
    },

    deleteOrder: async (orderId) => {
        const t = await sequelize.transaction();
        try {
            await OrderDetail.destroy({ where: { order_id: orderId } }, { transaction: t });
            await OrderItem.destroy({ where: { order_id: orderId } }, { transaction: t });
            const deleted = await Order.destroy({ where: { id: orderId } }, { transaction: t });

            await t.commit();
            return deleted > 0;
        } catch (error) {
            await t.rollback();
            logger.error(`❌ Lỗi khi xóa đơn hàng: ${error.message}`, { error });
            throw error;
        }
    }
};

module.exports = OrderService;
