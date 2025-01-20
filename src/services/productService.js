const { Product, Category, Color, Size, ProductCategory, ProductColor, ProductSize, ProductStock } = require('../models');
const { sequelize } = require('../models');  // Hoặc đường dẫn đúng đến nơi cấu hình sequelize
const slugify = require('slugify');
const { Op } = require('sequelize');

// Hàm tạo slug tự động từ tên sản phẩm
// Hàm tạo slug từ tên sản phẩm và id sản phẩm
const generateSlug = (name, id) => {
    return slugify(`${name}-FS-${id}`, { lower: true, strict: true });
};

const createProduct = async (productData) => {
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
            const slug = generateSlug(data.product_name, newProduct.id);

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
        throw error;
    }
};



// Hàm lấy tất cả sản phẩm
const getProducts = async () => {
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
        console.error('Error details:', error);
        throw new Error('Failed to fetch products');
    }
};

const getProductsByPagination = async ({ page = 1, limit = 20 }) => {
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
        console.error('Error fetching paginated products:', error);
        throw new Error('Failed to fetch products with pagination');
    }
};

// 2. Hàm lấy sản phẩm mới với phân trang
const getNewProductsByPagination = async ({ page = 1, limit = 20, sort, priceRange, colorIds }) => {
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
        console.error('Error fetching new products with pagination:', error);
        throw new Error('Failed to fetch new products with pagination');
    }
};


// 3. Hàm lấy sản phẩm nổi bật với phân trang
const getFeaturedProductsByPagination = async ({ page = 1, limit = 20, sort, priceRange, colorIds }) => {
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
        console.error('Error fetching featured products with pagination:', error);
        throw new Error('Failed to fetch featured products with pagination');
    }
};

// 3. Hàm lấy chi tiết sản phẩm
const getProductDetail = async (slug) => {
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
        throw error;
    }
};

// 4. Hàm cập nhật sản phẩm
const updateProduct = async (slug, productData) => {
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
        throw error;
    }
};

// 5. Hàm xóa sản phẩm
const deleteProduct = async (slug) => {
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
        throw error;
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductDetail,
    updateProduct,
    deleteProduct,
    getProductsByPagination,
    getNewProductsByPagination,
    getFeaturedProductsByPagination,
};
