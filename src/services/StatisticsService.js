const {
    sequelize,
    Order,
    OrderItem,
    Product,
    Color,
    Size,
    Category,
    ProductCategory,
    ProductColor // Thêm ProductColor vào đây
} = require('../models');
const { Op } = require('sequelize');

class StatisticsService {
    async getSalesStatistics() {
        try {
            const salesData = await OrderItem.findAll({
                attributes: [
                    'product_id',
                    'color_id',
                    'size_id',
                    [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'total_quantity'],
                    [sequelize.fn('SUM', sequelize.col('OrderItem.price')), 'total_revenue']
                ],
                include: [
                    {
                        model: Order,
                        attributes: [],
                        where: {
                            status: 'completed'
                        },
                        required: true
                    },
                    {
                        model: Product,
                        attributes: ['product_name', 'slug', 'price', 'discount_price'],
                        include: [
                            {
                                model: ProductCategory,
                                include: [{
                                    model: Category,
                                    attributes: ['name']
                                }]
                            },
                            {
                                model: Color,
                                through: {
                                    model: ProductColor,
                                    attributes: ['image']
                                },
                                as: 'productColors',
                                attributes: ['id', 'color', 'hex_code']
                            }
                        ]
                    },
                    {
                        model: Color,
                        attributes: ['color', 'hex_code']
                    },
                    {
                        model: Size,
                        attributes: ['size']
                    }
                ],
                group: [
                    'OrderItem.product_id',
                    'OrderItem.color_id',
                    'OrderItem.size_id',
                    'Product.id',
                    'Product.ProductCategories.id',
                    'Product.ProductCategories.Category.id',
                    'Product.productColors.ProductColor.id',
                    'Color.id',
                    'Size.id'
                ],
                order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']]
            });

            // Định dạng lại dữ liệu trả về
            const formattedData = salesData.map(item => {
                // Tìm ảnh tương ứng với color_id
                const colorProduct = item.Product.productColors.find(
                    pc => pc.id === item.color_id
                );
                const colorImage = colorProduct ? colorProduct.ProductColor.image : null;

                return {
                    product_id: item.product_id,
                    product_name: item.Product.product_name,
                    product_slug: item.Product.slug,
                    categories: item.Product.ProductCategories.map(pc => pc.Category.name),
                    color: {
                        name: item.Color.color,
                        hex_code: item.Color.hex_code,
                        image: colorImage
                    },
                    size: item.Size.size,
                    unit_price: item.Product.discount_price || item.Product.price,
                    total_quantity: parseInt(item.dataValues.total_quantity),
                    total_revenue: parseFloat(item.dataValues.total_revenue)
                };
            });

            return {
                success: true,
                data: formattedData
            };
        } catch (error) {
            console.error('Error in getSalesStatistics:', error);
            return {
                success: false,
                error: 'Failed to get sales statistics'
            };
        }
    }

    async getSalesByDateRange(startDate, endDate) {
        try {
            const salesData = await OrderItem.findAll({
                attributes: [
                    'product_id',
                    'color_id',
                    'size_id',
                    [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'total_quantity'],
                    [sequelize.fn('SUM', sequelize.col('OrderItem.price')), 'total_revenue'],
                    [sequelize.fn('DATE', sequelize.col('Order.created_at')), 'sale_date']
                ],
                include: [
                    {
                        model: Order,
                        attributes: [],
                        where: {
                            status: 'completed',
                            created_at: {
                                [Op.between]: [startDate, endDate]
                            }
                        },
                        required: true
                    },
                    {
                        model: Product,
                        attributes: ['product_name', 'slug', 'price', 'discount_price'],
                        include: [
                            {
                                model: ProductCategory,
                                include: [{
                                    model: Category,
                                    attributes: ['name']
                                }]
                            },
                            {
                                model: Color,
                                through: {
                                    model: ProductColor,
                                    attributes: ['image']
                                },
                                as: 'productColors',
                                attributes: ['id', 'color', 'hex_code']
                            }
                        ]
                    },
                    {
                        model: Color,
                        attributes: ['color', 'hex_code']
                    },
                    {
                        model: Size,
                        attributes: ['size']
                    }
                ],
                group: [
                    'OrderItem.product_id',
                    'OrderItem.color_id',
                    'OrderItem.size_id',
                    'Product.id',
                    'Product.ProductCategories.id',
                    'Product.ProductCategories.Category.id',
                    'Product.productColors.ProductColor.id',
                    'Color.id',
                    'Size.id',
                    [sequelize.fn('DATE', sequelize.col('Order.created_at'))]
                ],
                order: [
                    [sequelize.fn('DATE', sequelize.col('Order.created_at')), 'ASC'],
                    [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']
                ]
            });

            const formattedData = salesData.map(item => {
                // Tìm ảnh tương ứng với color_id
                const colorProduct = item.Product.productColors.find(
                    pc => pc.id === item.color_id
                );
                const colorImage = colorProduct ? colorProduct.ProductColor.image : null;

                return {
                    sale_date: item.dataValues.sale_date,
                    product_id: item.product_id,
                    product_name: item.Product.product_name,
                    product_slug: item.Product.slug,
                    categories: item.Product.ProductCategories.map(pc => pc.Category.name),
                    color: {
                        name: item.Color.color,
                        hex_code: item.Color.hex_code,
                        image: colorImage
                    },
                    size: item.Size.size,
                    unit_price: item.Product.discount_price || item.Product.price,
                    total_quantity: parseInt(item.dataValues.total_quantity),
                    total_revenue: parseFloat(item.dataValues.total_revenue)
                };
            });

            return {
                success: true,
                data: formattedData
            };
        } catch (error) {
            console.error('Error in getSalesByDateRange:', error);
            return {
                success: false,
                error: 'Failed to get sales statistics by date range'
            };
        }
    }
}

module.exports = new StatisticsService();
