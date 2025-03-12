const { Queue } = require('bullmq');
const { createClient } = require('redis');
const { sequelize } = require('../models');
const { Order, OrderDetails, OrderItem, Product, Size, Color, Payment, PaymentLog, Carrier, ProductColor, ProductStock } = require('../models');
const { Op } = require('sequelize');
const logger = require('../configs/winston');
require('dotenv').config();

// 🔥 Kết nối Redis
const redisQueueClient = createClient({
    socket: {
        host: '127.0.0.1',
        port: 6381
    }
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
        host: '127.0.0.1',
        port: 6381,
    }
});

const OrderService = {
    // 📌 Thêm đơn hàng vào hàng đợi
    createOrder: async (orderData) => {
        // if (!orderData.carrier_id || !orderData.original_price ||
        //     !orderData.discounted_price || !orderData.final_price || !orderData.items) {
        //     throw new Error("Thiếu thông tin quan trọng trong đơn hàng!");
        // }

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
        if (result) {
            const orderData = JSON.parse(result);
            // Lấy thông tin đơn hàng từ database để có expires_at
            if (orderData.orderId) {
                const order = await Order.findByPk(orderData.orderId);
                if (order) {
                    orderData.expires_at = order.expires_at;
                }
            }
            return orderData;
        }
        return null;
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
                    throw new Error(`Không tìm thấy stock cho sản phẩm: ${key}`);
                }

                if (availableStock < item.quantity) {
                    throw new Error(`Không đủ hàng trong kho cho sản phẩm ${key}. Còn lại: ${availableStock}, Yêu cầu: ${item.quantity}`);
                }
            }

            // Tạo đơn hàng
            const order = await Order.create({
                user_id: orderData.user_id,
                carrier_id: orderData.carrier_id,
                coupon_id: orderData.coupon_id,
                original_price: orderData.original_price,
                discount_amount: orderData.discount_amount,
                final_price: orderData.final_price,
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

                // 🔥 Lưu thông tin chi tiết đơn hàng
                await OrderDetails.create({
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
            console.error('Error in processOrder:', error);
            throw error;
        }
    },

    // 📌 Cập nhật trạng thái đơn hàng
    updateOrderStatus: async (orderId, status) => {
        // Kiểm tra orderId
        if (!orderId) {
            throw new Error('Order ID is required');
        }
    
        const allowedStatuses = ['pending', 'completed', 'cancelled', 'failed', 'in_payment', 'in_progress', 'shipping'];
        if (!allowedStatuses.includes(status)) {
            throw new Error('Invalid status');
        }
    
        const [updated] = await Order.update(
            { status },
            { 
                where: { id: orderId },
                // Thêm returning để kiểm tra kết quả
                returning: true
            }
        );
    
        return updated > 0;
    },

    // 📌 Hủy đơn hàng hết hạn và trả lại stock
    cancelExpiredOrders: async () => {
        const t = await sequelize.transaction();

        try {
            // Tìm các đơn hàng hết hạn hoặc đã hủy
            const ordersToCancel = await Order.findAll({
                attributes: [
                    'id',
                    'user_id',
                    'carrier_id',
                    'coupon_id',
                    'discount_amount',
                    'original_price',                 
                    'final_price',
                    'status',
                    'expires_at',
                    'created_at',
                    'updated_at'
                ],
                where: {
                    [Op.or]: [
                        {
                            status: 'pending',
                            expires_at: { [Op.lt]: new Date() }
                        },
                        {
                            status: 'cancelled',
                            updated_at: {
                                [Op.gt]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 10 MINUTE)')
                            }
                        }
                    ]
                },
                include: [{
                    model: OrderItem,
                    required: true,
                    where: {
                        reserved: true
                    }
                }],
                transaction: t
            });

            logger.info(`Found ${ordersToCancel.length} orders to process stock return`);

            for (const order of ordersToCancel) {
                for (const item of order.OrderItems) {
                    const stockKey = `stock:${item.product_id}:${item.size_id}:${item.color_id}`;

                    try {
                        // Sử dụng redisQueueClient thay vì redisClient
                        if (redisQueueClient.isReady) {
                            await redisQueueClient.incrBy(stockKey, item.quantity);
                        } else {
                            logger.warn('Redis Queue không khả dụng, bỏ qua cập nhật cache');
                        }

                        // Phần còn lại giữ nguyên
                        await ProductStock.update(
                            {
                                quantity: sequelize.literal(`quantity + ${item.quantity}`)
                            },
                            {
                                where: {
                                    product_id: item.product_id,
                                    size_id: item.size_id,
                                    color_id: item.color_id
                                },
                                transaction: t
                            }
                        );

                        await OrderItem.update(
                            { reserved: false },
                            {
                                where: { id: item.id },
                                transaction: t
                            }
                        );

                        logger.info(`Returned stock for item: ${stockKey}, quantity: ${item.quantity}`);
                    } catch (error) {
                        logger.error(`Failed to return stock for item: ${stockKey}`, error);
                        throw error;
                    }
                }

                // Cập nhật trạng thái đơn hàng nếu chưa bị hủy
                if (order.status === 'pending') {
                    await Order.update(
                        {
                            status: 'cancelled',
                            updated_at: new Date()
                        },
                        {
                            where: { id: order.id },
                            transaction: t
                        }
                    );
                    logger.info(`Cancelled expired order ${order.id}`);
                }
            }

            await t.commit();
            logger.info('Successfully processed expired/cancelled orders');
            return true;

        } catch (error) {
            await t.rollback();
            logger.error('Error processing expired/cancelled orders:', error);
            throw error;
        }
    },

    updateOrderStatus: async (orderId, status) => {
        const allowedStatuses = ['pending', 'completed', 'cancelled', 'failed', 'in_payment', 'in_progress', 'shipping'];
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
            where: { id: orderId, status: 'shipping' }
        });

        return updated > 0;
    },

    deleteOrder: async (orderId) => {
        const t = await sequelize.transaction();
        try {
            await OrderDetails.destroy({ where: { order_id: orderId } }, { transaction: t });
            await OrderItem.destroy({ where: { order_id: orderId } }, { transaction: t });
            const deleted = await Order.destroy({ where: { id: orderId } }, { transaction: t });

            await t.commit();
            return deleted > 0;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    },

    getOrdersByUserId: async (userId, page = 1, limit = 10) => {
        try {
            const offset = (page - 1) * limit;

            const orders = await Order.findAndCountAll({
                where: { user_id: userId },
                distinct: true,
                include: [
                    {
                        model: OrderDetails,
                        as: 'orderDetails', // Sử dụng đúng alias
                        required: false
                    },
                    {
                        model: OrderItem,
                        include: [
                            {
                                model: Product,
                                attributes: ['product_name', 'slug', 'price', 'discount_price', 'status', 'is_new'],
                                include: [
                                    {
                                        model: Color,
                                        as: 'productColors',
                                        attributes: ['color', 'hex_code'],
                                        through: {
                                            attributes: ['image']
                                        }
                                    }
                                ]
                            },
                            {
                                model: Size,
                                attributes: ['size']
                            },
                            {
                                model: Color,
                                attributes: ['color', 'hex_code']
                            }
                        ]
                    },
                    {
                        model: Payment,
                        attributes: ['payment_method', 'payment_status', 'payment_amount', 'transaction_id', 'payment_date']
                    },
                    {
                        model: Carrier,
                        attributes: ['name', 'price', 'description'] // Thêm price và description
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formattedOrders = orders.rows.map(order => ({
                id: order.id,
                status: order.status,
                pricing: {
                    original_price: order.original_price,
                    coupon_id: order.coupon_id || '',
                    discount_amount: order.discount_amount,
                    final_price: order.final_price
                },
                shipping: {
                    carrier: order.Carrier?.name || '',
                    shipping_fee: order.Carrier?.price || 0,
                    description: order.Carrier?.description || '',
                    recipient: order.orderDetails ? {
                        name: order.orderDetails.name,
                        email: order.orderDetails.email,
                        phone: order.orderDetails.phone,
                        address: {
                            street: order.orderDetails.street,
                            ward: order.orderDetails.ward,
                            district: order.orderDetails.district,
                            city: order.orderDetails.city,
                            country: order.orderDetails.country
                        }
                    } : {
                        name: '',
                        email: '',
                        phone: '',
                        address: {}
                    }
                },
                payment: {
                    method: order.Payment?.payment_method,
                    status: order.Payment?.payment_status,
                    amount: order.Payment?.payment_amount,
                    transaction_id: order.Payment?.transaction_id,
                    payment_date: order.Payment?.payment_date
                },
                items: order.OrderItems?.map(item => ({
                    product: {
                        name: item.Product?.product_name,
                        slug: item.Product?.slug,
                        status: item.Product?.status,
                        is_new: item.Product?.is_new,
                        price: {
                            original: item.Product?.price,
                            discounted: item.Product?.discount_price
                        }
                    },
                    variant: {
                        size: item.Size?.size,
                        color: {
                            name: item.Color?.color,
                            hex_code: item.Color?.hex_code,
                            image: item.Product?.productColors?.find(pc =>
                                pc.id === item.Color?.id
                            )?.ProductColor?.image || null
                        }
                    },
                    quantity: item.quantity,
                    price: item.price,
                    reserved: item.reserved,
                    reserved_until: item.reserved_until
                })),
                dates: {
                    created_at: order.created_at,
                    updated_at: order.updated_at,
                    expires_at: order.expires_at
                }
            }));

            return {
                orders: formattedOrders,
                total: orders.count,
                currentPage: page,
                totalPages: Math.ceil(orders.count / limit)
            };

        } catch (error) {
            console.error('Error in getOrdersByUserId:', error);
            throw error;
        }
    },

    getAllOrders: async (page = 1, limit = 10, filters = {}) => {
        try {
            const offset = (page - 1) * limit;
            let whereClause = {};

            // Xử lý các filter
            if (filters.status) {
                whereClause.status = filters.status;
            }
            if (filters.startDate && filters.endDate) {
                whereClause.created_at = {
                    [Op.between]: [filters.startDate, filters.endDate]
                };
            }

            // Thêm filter theo mã đơn hàng
            if (filters.orderId) {
                whereClause.id = filters.orderId;
            }

            // Tạo điều kiện tìm kiếm cho OrderDetails
            let orderDetailsWhere = {};
            if (filters.customerName) {
                orderDetailsWhere.name = { [Op.like]: `%${filters.customerName}%` };
            }
            if (filters.customerEmail) {
                orderDetailsWhere.email = { [Op.like]: `%${filters.customerEmail}%` };
            }
            if (filters.customerPhone) {
                orderDetailsWhere.phone = { [Op.like]: `%${filters.customerPhone}%` };
            }

            const orders = await Order.findAndCountAll({
                where: whereClause,
                distinct: true,
                include: [
                    {
                        model: OrderDetails,
                        as: 'orderDetails',
                        required: Object.keys(orderDetailsWhere).length > 0,
                        where: orderDetailsWhere,
                        required: false
                    },
                    {
                        model: OrderItem,
                        include: [
                            {
                                model: Product,
                                attributes: ['product_name', 'slug', 'price', 'discount_price', 'status', 'is_new'],
                                include: [
                                    {
                                        model: Color,
                                        as: 'productColors',
                                        attributes: ['color', 'hex_code'],
                                        through: {
                                            attributes: ['image']
                                        }
                                    }
                                ]
                            },
                            {
                                model: Size,
                                attributes: ['size']
                            },
                            {
                                model: Color,
                                attributes: ['color', 'hex_code']
                            }
                        ]
                    },
                    {
                        model: Payment,
                        attributes: ['payment_method', 'payment_status', 'payment_amount', 'transaction_id', 'payment_date']
                    },
                    {
                        model: Carrier,
                        attributes: ['name', 'price', 'description']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formattedOrders = orders.rows.map(order => ({
                id: order.id,
                status: order.status,
                user_id: order.user_id,
                pricing: {
                    original_price: order.original_price,
                    coupon_id: order.coupon_id || '',
                    discount_amount: order.discount_amount,
                    final_price: order.final_price
                },
                shipping: {
                    carrier: order.Carrier?.name || '',
                    shipping_fee: order.Carrier?.price || 0,
                    description: order.Carrier?.description || '',
                    recipient: order.orderDetails ? {
                        name: order.orderDetails.name,
                        email: order.orderDetails.email,
                        phone: order.orderDetails.phone,
                        address: {
                            street: order.orderDetails.street,
                            ward: order.orderDetails.ward,
                            district: order.orderDetails.district,
                            city: order.orderDetails.city,
                            country: order.orderDetails.country
                        }
                    } : null
                },
                payment: {
                    method: order.Payment?.payment_method,
                    status: order.Payment?.payment_status,
                    amount: order.Payment?.payment_amount,
                    transaction_id: order.Payment?.transaction_id,
                    payment_date: order.Payment?.payment_date
                },
                items: order.OrderItems?.map(item => ({
                    product: {
                        name: item.Product?.product_name,
                        slug: item.Product?.slug,
                        status: item.Product?.status,
                        is_new: item.Product?.is_new,
                        price: {
                            original: item.Product?.price,
                            discounted: item.Product?.discount_price
                        }
                    },
                    variant: {
                        size: item.Size?.size,
                        color: {
                            name: item.Color?.color,
                            hex_code: item.Color?.hex_code,
                            image: item.Product?.productColors?.find(pc =>
                                pc.id === item.Color?.id
                            )?.ProductColor?.image || null
                        }
                    },
                    quantity: item.quantity,
                    price: item.price,
                    reserved: item.reserved
                })),
                dates: {
                    created_at: order.created_at,
                    updated_at: order.updated_at,
                    expires_at: order.expires_at
                }
            }));

            return {
                orders: formattedOrders,
                total: orders.count,
                currentPage: page,
                totalPages: Math.ceil(orders.count / limit)
            };

        } catch (error) {
            console.error('Error in getAllOrders:', error);
            throw error;
        }
    }


};

module.exports = OrderService;
