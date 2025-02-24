// orderTrackingService.js
const { Order, OrderDetails, OrderItem, Product, Color, Size, Category } = require('../models');

const orderTrackingService = {
    async trackOrder(orderId, identifier) {
        try {
            // Tìm thông tin đơn hàng và địa chỉ
            const orderInfo = await Order.findOne({
                where: { id: orderId },
                include: [
                    {
                        model: OrderDetails,
                        as: 'orderDetails',
                        where: {
                            [identifier.includes('@') ? 'email' : 'phone']: identifier
                        },
                        required: true
                    },
                    {
                        model: OrderItem,
                        include: [
                            {
                                model: Product,
                                attributes: [
                                    'id', 
                                    'product_name', 
                                    'price',
                                    'description',
                                    'slug',
                                    'discount_price'
                                ],
                                include: [
                                    {
                                        model: Category,
                                        as: 'categories',
                                        attributes: ['id', 'name'],
                                        through: { attributes: [] }
                                    },
                                    {
                                        model: Color,
                                        as: 'productColors',
                                        attributes: ['id', 'color', 'hex_code'],
                                        through: { attributes: ['image'] }
                                    },
                                    {
                                        model: Size,
                                        as: 'productSizes',
                                        attributes: ['id', 'size'],
                                        through: { attributes: [] }
                                    }
                                ]
                            },
                            {
                                model: Color,
                                attributes: ['id', 'color', 'hex_code']
                            },
                            {
                                model: Size,
                                attributes: ['id', 'size']
                            }
                        ]
                    }
                ]
            });

            if (!orderInfo) {
                throw new Error('Không tìm thấy thông tin đơn hàng');
            }

            // Format dữ liệu trả về
            return {
                orderInfo: {
                    orderId: orderInfo.id,
                    orderStatus: orderInfo.status,
                    orderDate: orderInfo.created_at,
                    originalPrice: orderInfo.original_price,
                    discountAmount: orderInfo.discount_amount,
                    discountCode: orderInfo.discount_code,
                    finalPrice: orderInfo.final_price
                },
                customerInfo: {
                    name: orderInfo.orderDetails.name,
                    email: orderInfo.orderDetails.email,
                    phone: orderInfo.orderDetails.phone,
                    address: {
                        street: orderInfo.orderDetails.street,
                        ward: orderInfo.orderDetails.ward,
                        district: orderInfo.orderDetails.district,
                        city: orderInfo.orderDetails.city,
                        country: orderInfo.orderDetails.country
                    }
                },
                items: orderInfo.OrderItems.map(item => ({
                    product: {
                        id: item.Product.id,
                        name: item.Product.product_name,
                        slug: item.Product.slug,
                        price: item.Product.price,
                        discountPrice: item.Product.discount_price,
                        description: item.Product.description,
                        categories: item.Product.categories.map(cat => ({
                            id: cat.id,
                            name: cat.name
                        })),
                        availableColors: item.Product.productColors.map(color => ({
                            id: color.id,
                            color: color.color,
                            hexCode: color.hex_code,
                            image: color.ProductColor.image
                        })),
                        availableSizes: item.Product.productSizes.map(size => ({
                            id: size.id,
                            size: size.size
                        }))
                    },
                    orderedQuantity: item.quantity,
                    orderedPrice: item.price,
                    selectedColor: {
                        id: item.Color.id,
                        color: item.Color.color,
                        hexCode: item.Color.hex_code
                    },
                    selectedSize: {
                        id: item.Size.id,
                        size: item.Size.size
                    }
                }))
            };

        } catch (error) {
            throw new Error(`Lỗi khi tra cứu đơn hàng: ${error.message}`);
        }
    }
};

module.exports = orderTrackingService;
