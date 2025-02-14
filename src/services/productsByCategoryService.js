"use strict";

const { Op } = require('sequelize');
const { Product, Category, Color, Size, ProductStock } = require('../models');
const logger = require('../configs/winston');

/**
 * Retrieves a paginated list of products filtered by category with optional sorting and filtering.
 *
 * @async
 * @function getProductsByCategory
 * @param {number} categoryId - The ID of the category to filter products by.
 * @param {number} [page=1] - The current page number (default is 1).
 * @param {number} [limit=10] - The number of products per page (default is 10).
 * @param {string} [sort] - Sorting criteria: 'featured', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'oldest', or 'newest' (default is 'newest').
 * @param {string} [priceRange] - Price range filter in the format "min-max" (e.g., "100-500").
 * @param {Array<number>} [colorIds] - List of color IDs to filter by.
 * @returns {Promise<Object>} A promise that resolves to an object containing the paginated products, total count, and pagination metadata.
 * @throws {Error} If fetching products by category fails.
 *
 * @example
 * getProductsByCategory(5, 1, 10, 'price_asc', '100-500', [1, 2, 3])
 *  .then(data => console.log(data))
 *  .catch(error => console.error(error));
 */
const productByCategoryService = {
    getProductsByCategory: async (categoryId, page = 1, limit = 10, sort, priceRange, colorIds) => {
        try {
            const offset = (page - 1) * limit;

            let order = [];
            switch (sort) {
                case 'featured':
                    order.push(['is_featured', 'DESC']);
                    break;
                case 'price_asc':
                    order.push(['price', 'ASC']);
                    break;
                case 'price_desc':
                    order.push(['price', 'DESC']);
                    break;
                case 'name_asc':
                    order.push(['product_name', 'ASC']);
                    break;
                case 'name_desc':
                    order.push(['product_name', 'DESC']);
                    break;
                case 'oldest':
                    order.push(['created_at', 'ASC']);
                    break;
                case 'newest':
                    order.push(['created_at', 'DESC']);
                    break;
                default:
                    order.push(['created_at', 'DESC']);
            }

            let whereClause = {};
            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split('-').map(Number);
                whereClause.price = { [Op.between]: [minPrice, maxPrice] };
            }

            let colorFilter = {};
            if (colorIds?.length > 0) {
                colorFilter = { id: { [Op.in]: colorIds } };
            }

            const { count, rows } = await Product.findAndCountAll({
                where: whereClause,
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
                        where: colorFilter,
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
                order,
            });

            return {
                total: count,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                products: rows,
            };
        } catch (error) {
            logger.error('Error fetching products by category:', error);
            console.error('Error fetching products by category:', error);
            throw new Error('Unable to fetch products by category');
        }
    }
};

module.exports = productByCategoryService;
