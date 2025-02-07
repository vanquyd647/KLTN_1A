const { Queue } = require('bullmq');
const { createClient } = require('redis');
const { sequelize } = require('../models');
const Order = require('../models/Order')(sequelize);
const OrderDetail = require('../models/OrderDetails')(sequelize);
const OrderItem = require('../models/OrderItem')(sequelize);
const ProductStock = require('../models/ProductStock')(sequelize);
const { Op } = require('sequelize');
require('dotenv').config();

// 🔥 Kết nối Redis
const redisQueueClient = createClient({
    url: process.env.REDIS_URL2,
    password: process.env.REDIS_PASSWORD2
});

redisQueueClient.on('connect', () => console.log('✅ Kết nối Redis Queue thành công!'));
redisQueueClient.on('error', (err) => console.error('❌ Lỗi Redis Queue:', err));

(async () => {
    try {
        await redisQueueClient.connect();
    } catch (error) {
        console.error('❌ Không thể kết nối Redis Queue:', error);
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
        console.log("📥 Dữ liệu trước khi đưa vào hàng đợi:", JSON.stringify(orderData, null, 2));

        if (!orderData.carrier_id || !orderData.original_price ||
            !orderData.discounted_price || !orderData.final_price || !orderData.items) {
            console.error("❌ Lỗi: Dữ liệu đơn hàng bị thiếu khi thêm vào hàng đợi:", JSON.stringify(orderData, null, 2));
            throw new Error("Thiếu thông tin quan trọng trong đơn hàng!");
        }

        const job = await orderQueue.add('processOrder', orderData, {
            removeOnComplete: true,
            attempts: 3
        });

        return job.id;
    },

    // 📌 Lấy kết quả xử lý đơn hàng từ Redis (do Worker lưu)
    getOrderResult: async (jobId) => {
        const result = await redisQueueClient.get(`orderResult:${jobId}`);
        return result ? JSON.parse(result) : null;
    },

    // 📌 Xử lý đơn hàng (chạy trong Worker)
    processOrder: async (orderData) => {
        const t = await sequelize.transaction();
        try {
            const productIds = orderData.items.map(item => item.product_id);
            const sizeIds = orderData.items.map(item => item.size_id);
            const colorIds = orderData.items.map(item => item.color_id);

            // 🔥 Kiểm tra tồn kho thực tế từ MySQL trước khi xử lý đơn hàng
            const stockData = await ProductStock.findAll({
                where: {
                    product_id: { [Op.in]: productIds },
                    size_id: { [Op.in]: sizeIds },
                    color_id: { [Op.in]: colorIds }
                },
                transaction: t
            });

            // 🔥 Xây dựng stockMap từ MySQL
            const stockMap = {};
            for (const stock of stockData) {
                const key = `${stock.product_id}-${stock.size_id}-${stock.color_id}`;
                stockMap[key] = stock.quantity;
            }

            // 🔥 Kiểm tra số lượng tồn kho thực tế trước khi xử lý đơn hàng
            for (const item of orderData.items) {
                const key = `${item.product_id}-${item.size_id}-${item.color_id}`;
                const availableStock = stockMap[key] || 0;

                if (availableStock < item.quantity) {
                    console.error(`❌ Không đủ hàng: product_id=${item.product_id}, tồn kho=${availableStock}, yêu cầu=${item.quantity}`);
                    throw new Error(`Không đủ hàng trong kho cho sản phẩm product_id=${item.product_id}`);
                }
            }

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            // 🔥 Tạo đơn hàng trong Database
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
                expires_at: expiresAt
            }, { transaction: t });

            // 🔥 Lưu thông tin chi tiết đơn hàng
            await OrderDetail.create({
                order_id: order.id,
                user_id: orderData.user_id,
                name: orderData.name,
                email: orderData.email,
                phone: orderData.phone,
                street: orderData.street,
                ward: orderData.ward,
                district: orderData.district,
                city: orderData.city,
                country: orderData.country,
                address_id: orderData.address_id
            }, { transaction: t });

            // 🔥 Cập nhật kho MySQL
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

                console.log(`📉 Cập nhật kho MySQL: product_id=${item.product_id}, size_id=${item.size_id}, color_id=${item.color_id}, quantity=${item.quantity}`);
                await ProductStock.update(
                    { quantity: sequelize.literal(`quantity - ${item.quantity}`) },
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
            console.error(`❌ Đơn hàng bị hủy do lỗi: ${error.message}`);

            throw error;
        }
    },

    // 📌 Cập nhật trạng thái đơn hàng
    updateOrderStatus: async (orderId, status) => {
        const allowedStatuses = ['pending', 'completed', 'canceled', 'failed', 'in_payment', 'in_progress'];
        if (!allowedStatuses.includes(status)) {
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
            throw error;
        }
    }
};

module.exports = OrderService;
