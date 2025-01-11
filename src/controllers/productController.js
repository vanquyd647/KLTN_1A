const productService = require('../services/productService');
const redisClient = require('../configs/redisClient');

// Hàm thêm sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const productData = req.body;

        if (!productData.product_name || !productData.price || !productData.status) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Tất cả các trường thông tin đều bắt buộc.',
                data: null
            });
        }

        const newProduct = await productService.createProduct(productData);
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

        // Lưu kết quả vào cache Redis
        await redisClient.set(cacheKey, JSON.stringify(products), 'EX', 3600); // Lưu cache trong 1 giờ

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

        // Xóa cache sản phẩm cũ trong Redis để khi truy vấn lại sẽ lấy dữ liệu mới
        redisClient.del(`product_${slug}`);

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

        // Xóa cache của sản phẩm đã xóa
        redisClient.del(`product_${slug}`);

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

module.exports = {
    createProduct,
    getProducts,
    getProductDetail,
    updateProduct,
    deleteProduct
};
