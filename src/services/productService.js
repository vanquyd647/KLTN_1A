"use strict";

const { Product, Category, Color, Size, ProductCategory, ProductColor, ProductSize, ProductStock } = require('../models');
const { sequelize } = require('../models');  // Hoặc đường dẫn đúng đến nơi cấu hình sequelize
const elasticClient = require('../configs/elasticsearch');
const logger = require('../configs/winston');
const slugify = require('slugify');
const { Op } = require('sequelize');

const productService = {

    /**
     * Generates a slug for a product
     * @param {string} name - Product name
     * @param {number} id - Product ID
     * @returns {string} - Generated slug
     */
    generateSlug(name, id) {
        return slugify(`${name}-FS-${id}`, { lower: true, strict: true });
    },

    /**
     * Creates one or multiple products with associated categories, colors, sizes, and stock information
     * @param {Object|Object[]} productData - Product data or array of product data
     * @param {string} productData.product_name - Name of the product
     * @param {string} [productData.description] - Description of the product
     * @param {number} productData.price - Price of the product
     * @param {number} [productData.discount_price] - Discounted price (optional)
     * @param {boolean} [productData.is_new=false] - Flag indicating if the product is new
     * @param {boolean} [productData.is_featured=false] - Flag indicating if the product is featured
     * @param {string} productData.status - Status of the product
     * @param {string[]} productData.categories - List of category names
     * @param {Object[]} productData.colors - Array of color objects
     * @param {string} productData.colors.color - Color name
     * @param {string} [productData.colors.hex_code] - Hex code of the color (optional)
     * @param {string} [productData.colors.image] - Image URL of the color (optional)
     * @param {string[]} productData.sizes - List of available sizes
     * @param {Object[]} productData.stock - Stock information
     * @param {string} productData.stock.size - Size of the product
     * @param {string} productData.stock.color - Color of the product
     * @param {number} productData.stock.quantity - Quantity available
     * @returns {Promise<Object[]>} - Created product objects
     * @throws {Error} - If an error occurs during product creation
     */
    async createProduct(productData) {
        const t = await sequelize.transaction();

        try {
            const productsToAdd = Array.isArray(productData) ? productData : [productData];

            const createdProducts = [];

            for (const data of productsToAdd) {
                // 1. Tạo sản phẩm mà không có slug (slug sẽ thêm sau khi có product_id)
                const newProduct = await Product.create({
                    product_name: data.product_name,
                    description: data.description,
                    price: data.price,
                    discount_price: data.discount_price || null,
                    slug: '',
                    is_new: data.is_new || false,
                    is_featured: data.is_featured || false,
                    status: data.status,
                }, { transaction: t });

                // 2. Tạo slug bằng cách kết hợp product_name và product_id
                const slug = this.generateSlug(data.product_name, newProduct.id);

                // 3. Cập nhật lại slug cho sản phẩm
                await newProduct.update({ slug }, { transaction: t });

                // 4. Thêm các danh mục nếu chưa có và liên kết với sản phẩm
                for (const categoryName of data.categories) {
                    const [category] = await Category.findOrCreate({
                        where: { name: categoryName },
                        defaults: { name: categoryName, description: '' },
                        transaction: t,
                    });
                    await ProductCategory.create({
                        product_id: newProduct.id,
                        category_id: category.id,
                    }, { transaction: t });
                }

                // 5. Thêm các màu sắc nếu chưa có và liên kết với sản phẩm
                for (const colorData of data.colors) {
                    const [color] = await Color.findOrCreate({
                        where: { color: colorData.color },
                        defaults: { color: colorData.color, hex_code: colorData.hex_code || null },
                        transaction: t,
                    });
                    await ProductColor.create({
                        product_id: newProduct.id,
                        color_id: color.id,
                        image: colorData.image || null,
                    }, { transaction: t });
                }

                // 6. Thêm các kích thước nếu chưa có và liên kết với sản phẩm
                for (const sizeName of data.sizes) {
                    const [size] = await Size.findOrCreate({
                        where: { size: sizeName },
                        defaults: { size: sizeName },
                        transaction: t,
                    });
                    await ProductSize.create({
                        product_id: newProduct.id,
                        size_id: size.id,
                    }, { transaction: t });
                }

                // 7. Thêm thông tin tồn kho cho từng sự kết hợp của sản phẩm, màu sắc và kích thước
                for (const stock of data.stock) {
                    const { size, color, quantity } = stock;
                    const sizeRecord = await Size.findOne({ where: { size: size }, transaction: t });
                    const colorRecord = await Color.findOne({ where: { color: color }, transaction: t });

                    if (sizeRecord && colorRecord) {
                        await ProductStock.create({
                            product_id: newProduct.id,
                            size_id: sizeRecord.id,
                            color_id: colorRecord.id,
                            quantity: quantity,
                        }, { transaction: t });
                    }
                }

                createdProducts.push(newProduct);
            }

            // Cam kết giao dịch
            await t.commit();
            return createdProducts;
        } catch (error) {
            // Nếu có lỗi, rollback giao dịch
            await t.rollback();
            logger.error('Error creating products:', error);
            throw error;
        }
    },

    /**
     * Retrieves a list of products that are not discontinued.
     *
     * @async
     * @function getProducts
     * @returns {Promise<Array>} A promise that resolves to an array of product objects.
     * @throws {Error} If fetching products fails.
     *
     * @example
     * getProducts()
     *  .then(products => console.log(products))
     *  .catch(error => console.error(error));
     */
    async getProducts() {
        try {
            return await Product.findAll({
                where: {
                    status: { [Op.ne]: 'discontinued' },
                },
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                ],
            });
        } catch (error) {
            logger.error('Error fetching products:', error);
            console.error('Error details:', error);
            throw new Error('Failed to fetch products');
        }
    },

    /**
     * Retrieves a paginated list of products that are not discontinued.
     *
     * @async
     * @function getProductsByPagination
     * @param {Object} options - Pagination options.
     * @param {number} [options.page=1] - The current page number (default is 1).
     * @param {number} [options.limit=20] - The number of products per page (default is 20).
     * @returns {Promise<Object>} A promise that resolves to an object containing the paginated products and pagination metadata.
     * @throws {Error} If fetching paginated products fails.
     *
     * @example
     * getProductsByPagination({ page: 2, limit: 10 })
     *  .then(data => console.log(data))
     *  .catch(error => console.error(error));
     */
    async getProductsByPagination({ page = 1, limit = 20 }) {
        try {
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const offset = (pageNumber - 1) * limitNumber;

            // Tính tổng sản phẩm thực sự
            const totalItems = await Product.count({
                where: {
                    status: { [Op.ne]: 'discontinued' },
                },
            });

            // Lấy dữ liệu sản phẩm với phân trang
            const products = await Product.findAll({
                where: {
                    status: { [Op.ne]: 'discontinued' },
                },
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                ],
                limit: limitNumber,
                offset,
            });

            // Trả về dữ liệu với thông tin phân trang
            return {
                products,
                pagination: {
                    currentPage: pageNumber,
                    pageSize: limitNumber,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limitNumber),
                },
            };
        } catch (error) {
            logger.error('Error fetching paginated products:', error);
            console.error('Error fetching paginated products:', error);
            throw new Error('Failed to fetch products with pagination');
        }
    },

    /**
     * Retrieves a paginated list of new products with optional sorting and filtering.
     *
     * @async
     * @function getNewProductsByPagination
     * @param {Object} options - Options for pagination, sorting, and filtering.
     * @param {number} [options.page=1] - The current page number (default is 1).
     * @param {number} [options.limit=20] - The number of products per page (default is 20).
     * @param {string} [options.sort] - Sorting criteria: 'price_asc', 'price_desc', 'newest', or 'oldest' (default is 'newest').
     * @param {string} [options.priceRange] - Price range filter in the format "min-max" (e.g., "100-500").
     * @param {Array<number>} [options.colorIds] - List of color IDs to filter by.
     * @returns {Promise<Object>} A promise that resolves to an object containing the paginated new products and pagination metadata.
     * @throws {Error} If fetching new products with pagination fails.
     *
     * @example
     * getNewProductsByPagination({ page: 1, limit: 10, sort: 'price_asc', priceRange: '100-500', colorIds: [1, 2, 3] })
     *  .then(data => console.log(data))
     *  .catch(error => console.error(error));
     */
    async getNewProductsByPagination({ page = 1, limit = 20, sort, priceRange, colorIds }) {
        try {
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const offset = (pageNumber - 1) * limitNumber;

            // Xây dựng điều kiện sắp xếp
            const order = [];
            switch (sort) {
                case 'price_asc':
                    order.push(['price', 'ASC']);
                    break;
                case 'price_desc':
                    order.push(['price', 'DESC']);
                    break;
                case 'newest':
                    order.push(['created_at', 'DESC']);
                    break;
                case 'oldest':
                    order.push(['created_at', 'ASC']);
                    break;
                default:
                    order.push(['created_at', 'DESC']);
            }

            // Bộ lọc giá
            const whereClause = {
                is_new: true,
                status: { [Op.ne]: 'discontinued' },
            };
            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split('-').map(Number);
                whereClause.price = { [Op.between]: [minPrice, maxPrice] };
            }

            // Bộ lọc màu sắc
            const colorFilter = colorIds?.length > 0 ? { id: { [Op.in]: colorIds } } : {};

            // Tổng số sản phẩm mới
            const totalItems = await Product.count({
                where: whereClause,
            });

            // Lấy danh sách sản phẩm mới với phân trang
            const products = await Product.findAll({
                where: whereClause,
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                ],
                limit: limitNumber,
                offset,
                order,
            });

            return {
                products,
                pagination: {
                    currentPage: pageNumber,
                    pageSize: limitNumber,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limitNumber),
                },
            };
        } catch (error) {
            logger.error('Error fetching new products with pagination:', error);
            console.error('Error fetching new products with pagination:', error);
            throw new Error('Failed to fetch new products with pagination');
        }
    },


    /**
     * Retrieves a paginated list of featured products with optional sorting and filtering.
     *
     * @async
     * @function getFeaturedProductsByPagination
     * @param {Object} options - Options for pagination, sorting, and filtering.
     * @param {number} [options.page=1] - The current page number (default is 1).
     * @param {number} [options.limit=20] - The number of products per page (default is 20).
     * @param {string} [options.sort] - Sorting criteria: 'price_asc', 'price_desc', 'newest', or 'oldest' (default is 'newest').
     * @param {string} [options.priceRange] - Price range filter in the format "min-max" (e.g., "100-500").
     * @param {Array<number>} [options.colorIds] - List of color IDs to filter by.
     * @returns {Promise<Object>} A promise that resolves to an object containing the paginated featured products and pagination metadata.
     * @throws {Error} If fetching featured products with pagination fails.
     *
     * @example
     * getFeaturedProductsByPagination({ page: 1, limit: 10, sort: 'price_asc', priceRange: '100-500', colorIds: [1, 2, 3] })
     *  .then(data => console.log(data))
     *  .catch(error => console.error(error));
     */
    async getFeaturedProductsByPagination({ page = 1, limit = 20, sort, priceRange, colorIds }) {
        try {
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const offset = (pageNumber - 1) * limitNumber;

            // Xây dựng điều kiện sắp xếp
            const order = [];
            switch (sort) {
                case 'price_asc':
                    order.push(['price', 'ASC']);
                    break;
                case 'price_desc':
                    order.push(['price', 'DESC']);
                    break;
                case 'newest':
                    order.push(['created_at', 'DESC']);
                    break;
                case 'oldest':
                    order.push(['created_at', 'ASC']);
                    break;
                default:
                    order.push(['created_at', 'DESC']);
            }

            // Bộ lọc giá
            const whereClause = {
                is_featured: true,
                status: { [Op.ne]: 'discontinued' },
            };
            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split('-').map(Number);
                whereClause.price = { [Op.between]: [minPrice, maxPrice] };
            }

            // Bộ lọc màu sắc
            const colorFilter = colorIds?.length > 0 ? { id: { [Op.in]: colorIds } } : {};

            // Tổng số sản phẩm nổi bật
            const totalItems = await Product.count({
                where: whereClause,
            });

            // Lấy danh sách sản phẩm nổi bật với phân trang
            const products = await Product.findAll({
                where: whereClause,
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                ],
                limit: limitNumber,
                offset,
                order,
            });

            return {
                products,
                pagination: {
                    currentPage: pageNumber,
                    pageSize: limitNumber,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limitNumber),
                },
            };
        } catch (error) {
            logger.error('Error fetching featured products with pagination:', error);
            console.error('Error fetching featured products with pagination:', error);
            throw new Error('Failed to fetch featured products with pagination');
        }
    },

    /**
     * Retrieves a paginated list of new products with optional sorting and filtering.
     *
     * @async
     * @function getNewProductsByPagination
     * @param {Object} options - Options for pagination, sorting, and filtering.
     * @param {number} [options.page=1] - The current page number (default is 1).
     * @param {number} [options.limit=20] - The number of products per page (default is 20).
     * @param {string} [options.sort] - Sorting criteria: 'price_asc', 'price_desc', 'newest', or 'oldest' (default is 'newest').
     * @param {string} [options.priceRange] - Price range filter in the format "min-max" (e.g., "100-500").
     * @param {Array<number>} [options.colorIds] - List of color IDs to filter by.
     * @returns {Promise<Object>} A promise that resolves to an object containing the paginated new products and pagination metadata.
     * @throws {Error} If fetching new products with pagination fails.
     *
     * @example
     * getNewProductsByPagination({ page: 1, limit: 10, sort: 'price_asc', priceRange: '100-500', colorIds: [1, 2, 3] })
     *  .then(data => console.log(data))
     *  .catch(error => console.error(error));
     */
    async getNewProductsByPagination2({ page = 1, limit = 20 }) {
        try {
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const offset = (pageNumber - 1) * limitNumber;

            // Count total new products
            const totalItems = await Product.count({
                where: {
                    is_new: true,
                    status: { [Op.ne]: 'discontinued' },
                },
            });

            // Fetch paginated new products
            const products = await Product.findAll({
                where: {
                    is_new: true,
                    status: { [Op.ne]: 'discontinued' },
                },
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                ],
                limit: limitNumber,
                offset,
            });

            return {
                products,
                pagination: {
                    currentPage: pageNumber,
                    pageSize: limitNumber,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limitNumber),
                },
            };
        } catch (error) {
            logger.error('Error fetching new products with pagination:', error);
            console.error('Error fetching new products with pagination:', error);
            throw new Error('Failed to fetch new products with pagination');
        }
    },

    /**
     * Retrieves a paginated list of featured products with optional sorting and filtering.
     *
     * @async
     * @function getFeaturedProductsByPagination
     * @param {Object} options - Options for pagination, sorting, and filtering.
     * @param {number} [options.page=1] - The current page number (default is 1).
     * @param {number} [options.limit=20] - The number of products per page (default is 20).
     * @param {string} [options.sort] - Sorting criteria: 'price_asc', 'price_desc', 'newest', or 'oldest' (default is 'newest').
     * @param {string} [options.priceRange] - Price range filter in the format "min-max" (e.g., "100-500").
     * @param {Array<number>} [options.colorIds] - List of color IDs to filter by.
     * @returns {Promise<Object>} A promise that resolves to an object containing the paginated featured products and pagination metadata.
     * @throws {Error} If fetching featured products with pagination fails.
     *
     * @example
     * getFeaturedProductsByPagination({ page: 1, limit: 10, sort: 'price_asc', priceRange: '100-500', colorIds: [1, 2, 3] })
     *  .then(data => console.log(data))
     *  .catch(error => console.error(error));
     */
    async getFeaturedProductsByPagination2({ page = 1, limit = 20 }) {
        try {
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const offset = (pageNumber - 1) * limitNumber;

            // Count total featured products
            const totalItems = await Product.count({
                where: {
                    is_featured: true,
                    status: { [Op.ne]: 'discontinued' },
                },
            });

            // Fetch paginated featured products
            const products = await Product.findAll({
                where: {
                    is_featured: true,
                    status: { [Op.ne]: 'discontinued' },
                },
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                ],
                limit: limitNumber,
                offset,
            });

            return {
                products,
                pagination: {
                    currentPage: pageNumber,
                    pageSize: limitNumber,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limitNumber),
                },
            };
        } catch (error) {
            logger.error('Error fetching featured products with pagination:', error);
            console.error('Error fetching featured products with pagination:', error);
            throw new Error('Failed to fetch featured products with pagination');
        }
    },

    /**
     * Retrieves the details of a specific product by its slug.
     *
     * @async
     * @function getProductDetail
     * @param {string} slug - The unique slug of the product.
     * @returns {Promise<Object>} A promise that resolves to the product details, including related categories, colors, sizes, and stock information.
     * @throws {Error} If the product does not exist or if there is an error during the query.
     *
     * @example
     * getProductDetail('example-product-slug')
     *  .then(product => console.log(product))
     *  .catch(error => console.error(error));
     */
    async getProductDetail(slug) {
        try {
            const product = await Product.findOne({
                where: { slug },
                include: [
                    {
                        model: Category,
                        as: 'categories',
                        attributes: ['id', 'name'],
                        through: { attributes: [] },
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
                    }
                ],
            });

            if (!product) throw new Error('Sản phẩm không tồn tại');
            return product;
        } catch (error) {
            logger.error('Error fetching product details:', error);
            console.error('Error fetching product details:', error);
            throw error;
        }
    },

    /**
     * Updates the details of a product identified by its slug.
     *
     * @async
     * @function updateProduct
     * @param {string} slug - The unique slug of the product to update.
     * @param {Object} productData - The updated product data.
     * @param {string} [productData.product_name] - The updated product name.
     * @param {string} [productData.description] - The updated product description.
     * @param {number} [productData.price] - The updated product price.
     * @param {number} [productData.discount_price] - The updated discount price.
     * @param {boolean} [productData.is_featured] - Whether the product is featured.
     * @param {string} [productData.status] - The updated status of the product.
     * @returns {Promise<Object>} A promise that resolves to the updated product object.
     * @throws {Error} If the product does not exist or if the update process fails.
     *
     * @example
     * updateProduct('example-slug', {
     *   product_name: 'Updated Product Name',
     *   price: 150.00,
     *   discount_price: 120.00,
     *   is_featured: true,
     *   status: 'active'
     * })
     * .then(updatedProduct => console.log(updatedProduct))
     * .catch(error => console.error(error));
     */
    async updateProduct(slug, productData) {
        const t = await sequelize.transaction();

        try {
            const product = await Product.findOne({ where: { slug }, transaction: t });

            if (!product) throw new Error('Sản phẩm không tồn tại');

            // Cập nhật thông tin sản phẩm
            product.product_name = productData.product_name || product.product_name;
            product.description = productData.description || product.description;
            product.price = productData.price || product.price;
            product.discount_price = productData.discount_price || product.discount_price;
            product.is_featured = productData.is_featured !== undefined ? productData.is_featured : product.is_featured;
            product.status = productData.status || product.status;

            await product.save({ transaction: t });

            // Xử lý các thay đổi khác (danh mục, màu sắc, kích thước, tồn kho) ở đây

            // Cam kết giao dịch
            await t.commit();
            return product;
        } catch (error) {
            await t.rollback();
            logger.error('Error updating product:', error);
            console.error('Error updating product:', error);
            throw error;
        }
    },

    /**
     * Deletes a product identified by its slug, along with its related associations.
     *
     * @async
     * @function deleteProduct
     * @param {string} slug - The unique slug of the product to delete.
     * @returns {Promise<Object>} A promise that resolves to a success message when the product is deleted.
     * @throws {Error} If the product does not exist or if the deletion process fails.
     *
     * @example
     * deleteProduct('example-slug')
     *  .then(response => console.log(response))
     *  .catch(error => console.error(error));
     */
    async deleteProduct(slug) {
        const t = await sequelize.transaction();

        try {
            const product = await Product.findOne({ where: { slug }, transaction: t });

            if (!product) throw new Error('Sản phẩm không tồn tại');

            // Xóa các liên kết liên quan đến sản phẩm
            await ProductCategory.destroy({ where: { product_id: product.id }, transaction: t });
            await ProductColor.destroy({ where: { product_id: product.id }, transaction: t });
            await ProductSize.destroy({ where: { product_id: product.id }, transaction: t });
            await ProductStock.destroy({ where: { product_id: product.id }, transaction: t });

            // Xóa sản phẩm
            await product.destroy({ transaction: t });

            // Cam kết giao dịch
            await t.commit();
            return { message: 'Sản phẩm đã được xóa' };
        } catch (error) {
            await t.rollback();
            logger.error('Error deleting product:', error);
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Thêm vào productService
    // Trong productService object
    async searchProductsByNameAndColor(keyword, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                sort = 'newest'
            } = options;

            const from = (page - 1) * limit;

            // Xây dựng query
            const body = {
                from,
                size: limit,
                query: {
                    bool: {
                        should: [
                            {
                                multi_match: {
                                    query: keyword,
                                    fields: [
                                        "product_name^3",
                                        "product_name.keyword^4"
                                    ],
                                    type: "best_fields",
                                    operator: "and",
                                    fuzziness: "AUTO",
                                    prefix_length: 2
                                }
                            },
                            {
                                nested: {
                                    path: "productColors",
                                    query: {
                                        multi_match: {
                                            query: keyword,
                                            fields: [
                                                "productColors.color^2",
                                                "productColors.color.keyword^3"
                                            ],
                                            type: "best_fields",
                                            operator: "and"
                                        }
                                    },
                                    inner_hits: {
                                        highlight: {
                                            fields: {
                                                "productColors.color": {}
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        minimum_should_match: 1,
                        filter: [
                            { term: { status: "available" } }
                        ]
                    }
                },
                highlight: {
                    fields: {
                        product_name: {
                            pre_tags: ["<strong>"],
                            post_tags: ["</strong>"],
                            fragment_size: 150,
                            number_of_fragments: 3
                        }
                    }
                },
                sort: [
                    { _score: "desc" },
                    sort === "newest" ? { id: "desc" } : { id: "asc" }
                ]
            };

            const response = await elasticClient.search({
                index: 'products',
                body
            });

            // Xử lý kết quả
            const products = await Promise.all(response.hits.hits.map(async hit => {
                const productId = hit._source.id;
                const product = await Product.findByPk(productId, {
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
                });

                return {
                    ...product.toJSON(),
                    highlights: {
                        product_name: hit.highlight?.product_name,
                        colors: hit.inner_hits?.productColors.hits.hits.map(colorHit => ({
                            color: colorHit.highlight['productColors.color']
                        }))
                    },
                    score: hit._score
                };
            }));

            return {
                products,
                pagination: {
                    currentPage: page,
                    pageSize: limit,
                    totalItems: response.hits.total.value,
                    totalPages: Math.ceil(response.hits.total.value / limit)
                }
            };

        } catch (error) {
            logger.error('Lỗi tìm kiếm sản phẩm:', error);
            throw new Error('Không thể tìm kiếm sản phẩm');
        }
    }

};

module.exports = productService;