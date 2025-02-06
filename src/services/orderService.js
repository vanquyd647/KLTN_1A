const redisClient = require('../configs/redisClient'); // Kết nối Redis
const { sequelize } = require('../models');
const Order = require('../models/Order')(sequelize);
const OrderDetail = require('../models/OrderDetails')(sequelize);
const OrderItem = require('../models/OrderItem')(sequelize);
const ProductStock = require('../models/ProductStock')(sequelize);
const { Op } = require('sequelize');

const OrderService = {
    createOrder: async (orderData) => {
        const t = await sequelize.transaction();
        try {
            const productIds = orderData.items.map(item => item.product_id);
            const sizeIds = orderData.items.map(item => item.size_id);
            const colorIds = orderData.items.map(item => item.color_id);

            // 🔥 Luôn cập nhật stock từ Database lên Redis
            const stockData = await ProductStock.findAll({
                where: {
                    product_id: { [Op.in]: productIds },
                    size_id: { [Op.in]: sizeIds },
                    color_id: { [Op.in]: colorIds }
                }
            });

            const stockMap = {};
            for (const stock of stockData) {
                const key = `stock:${stock.product_id}:${stock.size_id}:${stock.color_id}`;
                stockMap[key] = stock.quantity;
                await redisClient.set(key, stock.quantity);
            }

            // 🔥 Kiểm tra tồn kho và giữ hàng bằng Redis Transaction
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                
                let success = false;
                while (!success) {
                    await redisClient.watch(key); // Theo dõi key tồn kho

                    let availableStock = await redisClient.get(key);
                    availableStock = availableStock ? parseInt(availableStock, 10) : stockMap[key];

                    if (availableStock < item.quantity) {
                        await redisClient.unwatch(); // Bỏ theo dõi nếu không đủ hàng
                        throw new Error(`Out of stock: product_id ${item.product_id}`);
                    }

                    // Dùng MULTI + EXEC để đảm bảo không bị race condition
                    const multi = redisClient.multi();
                    multi.decrBy(key, item.quantity);
                    const execResult = await multi.exec();

                    if (execResult) {
                        success = true; // Nếu EXEC thành công, tiếp tục xử lý đơn hàng
                    }
                }
            }

            // 🔥 Xác định thời gian hết hạn của đơn hàng
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

            // 🔥 Lưu thông tin sản phẩm vào đơn hàng & Trừ kho trong Database
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

                await ProductStock.update(
                    { quantity: sequelize.literal(`quantity - ${item.quantity}`) },
                    {
                        where: {
                            product_id: item.product_id,
                            size_id: item.size_id,
                            color_id: item.color_id
                        },
                        transaction: t
                    }
                );
            }

            await t.commit();

            // 🔥 Cập nhật lại Redis với số lượng tồn kho mới sau khi đặt hàng thành công
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                
                // Lấy lại số lượng stock từ Database
                const updatedStock = await ProductStock.findOne({
                    where: {
                        product_id: item.product_id,
                        size_id: item.size_id,
                        color_id: item.color_id
                    }
                });

                if (updatedStock) {
                    await redisClient.set(key, updatedStock.quantity); // Cập nhật Redis
                }
            }

            return order;
        } catch (error) {
            await t.rollback();

            // 🔥 Nếu lỗi, trả lại số lượng hàng đã giữ trong Redis
            for (const item of orderData.items) {
                const key = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;
                await redisClient.incrBy(key, item.quantity);
            }

            throw error;
        }
    },

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
                await redisClient.incrBy(stockKey, item.quantity);

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
