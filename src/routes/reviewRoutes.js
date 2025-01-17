const express = require('express');
const {
    createReviewHandler,
    getProductReviewsHandler,
    getAverageRatingHandler,
    deleteReviewHandler,
} = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Tạo review mới
router.post('/', authMiddleware, createReviewHandler);

// Lấy danh sách review của một sản phẩm
router.get('/product/:productId', getProductReviewsHandler);

// Lấy điểm trung bình của sản phẩm
router.get('/product/:productId/average-rating', getAverageRatingHandler);

// Xóa review
router.delete('/:id', authMiddleware, deleteReviewHandler);

module.exports = router; // Export router đúng cách
