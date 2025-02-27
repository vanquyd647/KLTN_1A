"use strict";

const productService = require('../services/productService');
const redisClient = require('../configs/redisClient');

// Hàm thêm sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const productData = req.body;

        const newProduct = await productService.createProduct(productData);

        // Xóa tất cả cache liên quan
        const deleteKeys = [
            'product_stocks',
            'products',
            `product_${newProduct[0].slug}`,
        ];

        // Xóa cache cho các trang phân trang
        const pages = Array.from({ length: 10 }, (_, i) => i + 1);
        const limits = [5, 10, 20, 50];

        // Thêm mới: Các filter phổ biến cần xóa cache
        const commonFilters = [
            {}, // không filter
            { name: '' },
            { priceRange: '0-100000' },
            { priceRange: '100000-500000' },
            { priceRange: '500000-1000000' },
            { priceRange: '1000000-up' },
            { sort: 'newest' },
            { sort: 'price_asc' },
            { sort: 'price_desc' },
            { sort: 'name_asc' },
            { sort: 'name_desc' }
        ];

        pages.forEach(page => {
            limits.forEach(limit => {
                // Cache keys cho pagination cơ bản
                deleteKeys.push(
                    `products_page_${page}_limit_${limit}`,
                    `new_products_page_${page}_limit_${limit}`,
                    `featured_products_page_${page}_limit_${limit}`
                );

                // Thêm cache keys cho các filter phổ biến
                commonFilters.forEach(filter => {
                    deleteKeys.push(
                        `products_page_${page}_limit_${limit}_filters_${JSON.stringify(filter)}`
                    );
                });
            });
        });

        // Xóa tất cả các key cache
        await Promise.all(deleteKeys.map(key => redisClient.del(key)));
        return res.status(201).json({
            status: 'success',
            code: 201,
            message: 'Sản phẩm đã được tạo thành công',
            data: newProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi tạo sản phẩm',
            data: null
        });
    }
};

const getProducts = async (req, res) => {
    try {
        // Kiểm tra Redis xem có cache không
        const cacheKey = 'products';
        const cachedProducts = await redisClient.get(cacheKey);

        // Nếu có dữ liệu trong cache, trả về luôn
        if (cachedProducts) {
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy danh sách sản phẩm thành công từ cache',
                data: JSON.parse(cachedProducts),
            });
        }

        // Nếu không có trong cache, truy vấn cơ sở dữ liệu
        const products = await productService.getProducts(req.query);

        // Nếu không có sản phẩm, trả về lỗi 404
        if (!products || products.length === 0) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Không có sản phẩm nào',
                data: null,
            });
        }

        /// Lưu kết quả vào Redis với thời gian hết hạn (ví dụ 1 giờ)
        await redisClient.set(cacheKey, JSON.stringify(products), {
            EX: 3600, // thời gian hết hạn là 3600 giây
        });
        // Trả về danh sách sản phẩm
        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm thành công',
            data: products,
        });
    } catch (error) {
        console.error('Unexpected Error:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi không xác định',
            data: null,
        });
    }
};

// Hàm lấy chi tiết sản phẩm
const getProductDetail = async (req, res) => {
    try {
        const { slug } = req.params;
        const cacheKey = `product_${slug}`;

        // Kiểm tra Redis trước
        const cachedProduct = await redisClient.get(cacheKey);

        if (cachedProduct) {
            // Nếu có dữ liệu trong Redis thì trả về dữ liệu từ cache
            console.log('Dữ liệu chi tiết sản phẩm lấy từ Redis');
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy chi tiết sản phẩm thành công từ cache',
                data: JSON.parse(cachedProduct)
            });
        }

        // Nếu không có trong Redis, truy vấn vào DB
        const product = await productService.getProductDetail(slug);

        if (!product) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Sản phẩm không tồn tại',
                data: null
            });
        }

        // Lưu kết quả vào Redis với thời gian hết hạn (ví dụ 1 giờ)
        await redisClient.set(cacheKey, JSON.stringify(product), {
            EX: 3600, // thời gian hết hạn là 3600 giây
        });
        console.log('Dữ liệu chi tiết sản phẩm lấy từ DB');

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy chi tiết sản phẩm thành công',
            data: product
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi lấy chi tiết sản phẩm',
            data: null
        });
    }
};

// Hàm cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { slug } = req.params;
        const productData = req.body;

        if (!productData.product_name || !productData.price || !productData.status) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Tất cả các trường thông tin đều bắt buộc.',
                data: null
            });
        }

        const updatedProduct = await productService.updateProduct(slug, productData);

        // Xóa tất cả cache liên quan
        const deleteKeys = [
            'product_stocks',
            'products',
            `product_${slug}`
        ];

        // Xóa cache cho các trang phân trang
        const pages = Array.from({ length: 10 }, (_, i) => i + 1);
        const limits = [5, 10, 20, 50];

        // Thêm mới: Các filter phổ biến cần xóa cache
        const commonFilters = [
            {}, // không filter
            { name: '' },
            { priceRange: '0-100000' },
            { priceRange: '100000-500000' },
            { priceRange: '500000-1000000' },
            { priceRange: '1000000-up' },
            { sort: 'newest' },
            { sort: 'price_asc' },
            { sort: 'price_desc' },
            { sort: 'name_asc' },
            { sort: 'name_desc' }
        ];

        pages.forEach(page => {
            limits.forEach(limit => {
                // Cache keys cho pagination cơ bản
                deleteKeys.push(
                    `products_page_${page}_limit_${limit}`,
                    `new_products_page_${page}_limit_${limit}`,
                    `featured_products_page_${page}_limit_${limit}`
                );

                // Thêm cache keys cho các filter phổ biến
                commonFilters.forEach(filter => {
                    deleteKeys.push(
                        `products_page_${page}_limit_${limit}_filters_${JSON.stringify(filter)}`
                    );
                });
            });
        });

        // Xóa tất cả các key cache
        await Promise.all(deleteKeys.map(key => redisClient.del(key)));

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Sản phẩm đã được cập nhật',
            data: updatedProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi cập nhật sản phẩm',
            data: null
        });
    }
};

// Hàm xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { slug } = req.params;
        const deleteMessage = await productService.deleteProduct(slug);

        // Xóa cache sản phẩm cũ trong Redis để khi truy vấn lại sẽ lấy dữ liệu mới
        redisClient.del(`product_${slug}`);
        // Xóa tất cả cache liên quan
        const deleteKeys = [
            'product_stocks', // Cache cho tồn kho sản phẩm
            'products', // Cache cho danh sách sản phẩm
        ];

        // Xóa cache cho các trang phân trang
        const pages = Array.from({ length: 10 }, (_, i) => i + 1); // Giả sử có 10 trang
        const limits = [5, 10, 20, 50]; // Các limit phổ biến

        pages.forEach(page => {
            limits.forEach(limit => {
                deleteKeys.push(
                    `products_page_${page}_limit_${limit}`,
                    `new_products_page_${page}_limit_${limit}`,
                    `featured_products_page_${page}_limit_${limit}`
                );
            });
        });

        // Xóa tất cả các key cache
        await Promise.all(deleteKeys.map(key => redisClient.del(key)));

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Sản phẩm đã được xóa',
            data: deleteMessage
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi xóa sản phẩm',
            data: null
        });
    }
};

// Hàm lấy sản phẩm với phân trang
const getProductsByPagination = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        // Lấy các tham số filter từ query
        const filters = {
            name: req.query.name,
            categoryIds: req.query.categories ? req.query.categories.split(',').map(Number) : null,
            colorIds: req.query.colors ? req.query.colors.split(',').map(Number) : null,
            sizeIds: req.query.sizes ? req.query.sizes.split(',').map(Number) : null,
            priceRange: req.query.priceRange,
            sort: req.query.sort || 'newest'
        };

        const cacheKey = `products_page_${page}_limit_${limit}_filters_${JSON.stringify(filters)}`;
        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy danh sách sản phẩm thành công từ cache',
                data: JSON.parse(cachedProducts),
            });
        }

        const products = await productService.getProductsByPagination({ page, limit, filters });

        if (!products || products.products.length === 0) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Không có sản phẩm nào',
                data: null,
            });
        }

        await redisClient.set(cacheKey, JSON.stringify(products), {
            EX: 3600,
        });

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm thành công',
            data: products,
        });
    } catch (error) {
        console.error('Error in getProductsByPagination:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi lấy danh sách sản phẩm',
            data: null,
        });
    }
};


// API for New Products with Pagination
const getNewProductsByPagination = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Default to 1
        const limit = parseInt(req.query.limit, 10) || 20; // Default to 20
        const sort = req.query.sort || 'newest';
        const priceRange = req.query.priceRange || null;
        const colorIds = req.query.colorIds ? req.query.colorIds.split(',') : [];

        const products = await productService.getNewProductsByPagination({
            page,
            limit,
            sort,
            priceRange,
            colorIds,
        });

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm mới thành công',
            data: products,
        });
    } catch (error) {
        console.error('Error in getNewProductsByPagination:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi lấy danh sách sản phẩm mới',
            data: null,
        });
    }
};

// API for Featured Products with Pagination
const getFeaturedProductsByPagination = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Default to 1
        const limit = parseInt(req.query.limit, 10) || 20; // Default to 20
        const sort = req.query.sort || 'newest';
        const priceRange = req.query.priceRange || null;
        const colorIds = req.query.colorIds ? req.query.colorIds.split(',') : [];

        const products = await productService.getFeaturedProductsByPagination({
            page,
            limit,
            sort,
            priceRange,
            colorIds,
        });

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm nổi bật thành công',
            data: products,
        });
    } catch (error) {
        console.error('Error in getFeaturedProductsByPagination:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi lấy danh sách sản phẩm nổi bật',
            data: null,
        });
    }
};

const getNewProductsByPagination2 = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Default to 1 if not provided
        const limit = parseInt(req.query.limit, 10) || 20; // Default to 20 if not provided

        const cacheKey = `new_products_page_${page}_limit_${limit}`;
        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy danh sách sản phẩm mới thành công từ cache',
                data: JSON.parse(cachedProducts),
            });
        }

        const products = await productService.getNewProductsByPagination({ page, limit });

        if (!products || products.products.length === 0) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Không có sản phẩm mới nào',
                data: null,
            });
        }

        await redisClient.set(cacheKey, JSON.stringify(products), {
            EX: 3600, // Cache for 1 hour
        });

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm mới thành công',
            data: products,
        });
    } catch (error) {
        console.error('Error in getNewProductsByPagination:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi lấy danh sách sản phẩm mới',
            data: null,
        });
    }
};

// API for Featured Products with Pagination
const getFeaturedProductsByPagination2 = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Default to 1 if not provided
        const limit = parseInt(req.query.limit, 10) || 20; // Default to 20 if not provided

        const cacheKey = `featured_products_page_${page}_limit_${limit}`;
        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            return res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy danh sách sản phẩm nổi bật thành công từ cache',
                data: JSON.parse(cachedProducts),
            });
        }

        const products = await productService.getFeaturedProductsByPagination({ page, limit });

        if (!products || products.products.length === 0) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Không có sản phẩm nổi bật nào',
                data: null,
            });
        }

        await redisClient.set(cacheKey, JSON.stringify(products), {
            EX: 3600, // Cache for 1 hour
        });

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm nổi bật thành công',
            data: products,
        });
    } catch (error) {
        console.error('Error in getFeaturedProductsByPagination:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi khi lấy danh sách sản phẩm nổi bật',
            data: null,
        });
    }
};

const searchProductsByNameAndColor = async (req, res) => {
    try {
        const { keyword, page, limit, sort } = req.query;

        if (!keyword) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng nhập từ khóa tìm kiếm'
            });
        }

        const results = await productService.searchProductsByNameAndColor(keyword, {
            page: parseInt(page),
            limit: parseInt(limit),
            sort
        });

        return res.json({
            code: 200,
            status: 'success',
            message: 'Tìm kiếm thành công',
            data: results
        });

    } catch (error) {
        console.error('Lỗi controller tìm kiếm:', error);
        return res.status(500).json({
            code: 500,
            status: 'error',
            message: 'Lỗi khi tìm kiếm sản phẩm'
        });
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
    getNewProductsByPagination2,
    getFeaturedProductsByPagination2,
    searchProductsByNameAndColor,
};
