const express = require('express');
const productController = require('../controllers/productController');
const rateLimiter = require('../middlewares/rateLimiter');

const router = express.Router();

// Định nghĩa các route cho sản phẩm với rateLimiter

// Tạo sản phẩm mới (POST /products)
router.post('/', rateLimiter, productController.createProduct);

// Lấy tất cả sản phẩm (GET /products)
router.get('/', rateLimiter, productController.getProducts);

// Lấy chi tiết sản phẩm (GET /products/:slug)
router.get('/:slug', rateLimiter, productController.getProductDetail);

// Cập nhật sản phẩm (PUT /products/:slug)
router.put('/:slug', rateLimiter, productController.updateProduct);

// Xóa sản phẩm (DELETE /products/:slug)
router.delete('/:slug', rateLimiter, productController.deleteProduct);

module.exports = router;
