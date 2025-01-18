const { Product, Category, Color, Size, ProductStock } = require('../models');

const getProductsByCategory = async (categoryId, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit; // Tính toán offset dựa trên trang và giới hạn
        const { count, rows } = await Product.findAndCountAll({
            where: {}, // Nếu có điều kiện bổ sung, thêm vào đây
            include: [
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] },
                    where: { id: categoryId },
                },
                {
                    model: Color,
                    as: 'productColors',
                    attributes: ['id', 'color', 'hex_code'],
                    through: { attributes: ['image'] },
                },
                {
                    model: Size,
                    as: 'productSizes',
                    attributes: ['id', 'size'],
                    through: { attributes: [] },
                },
                {
                    model: ProductStock,
                },
            ],
            limit,
            offset,
        });

        return {
            total: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            products: rows,
        };
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw new Error('Unable to fetch products by category');
    }
};

module.exports = {
    getProductsByCategory,
};
