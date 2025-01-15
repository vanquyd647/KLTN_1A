const express = require('express');
const productController = require('../controllers/productController');
const rateLimiter = require('../middlewares/rateLimiter');
const ensureSession = require('../middlewares/ensureSession'); // Import ensureSession middleware

const router = express.Router();

router.use(ensureSession);
// Định nghĩa các route cho sản phẩm với rateLimiter

// Tạo sản phẩm mới (POST /products)
router.post('/', rateLimiter, productController.createProduct);

// Lấy tất cả sản phẩm (GET /products)
router.get('/', rateLimiter, productController.getProducts);

// Lấy sản phẩm với phân trang (GET /products/pagination)
router.get('/pagination', rateLimiter, productController.getProductsByPagination);

// Lấy chi tiết sản phẩm (GET /products/:slug)
router.get('/:slug', rateLimiter, productController.getProductDetail);

// Cập nhật sản phẩm (PUT /products/:slug)
router.put('/:slug', rateLimiter, productController.updateProduct);

// Xóa sản phẩm (DELETE /products/:slug)
router.delete('/:slug', rateLimiter, productController.deleteProduct);

module.exports = router;
