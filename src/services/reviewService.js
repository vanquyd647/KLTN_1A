const { Op } = require('sequelize');
const { Review, Product, User } = require('../models'); // Đảm bảo đường dẫn chính xác

// Tạo một review mới
async function createReview({ productId, userId, rating, reviewText }) {
    try {
        const newReview = await Review.create({
            product_id: productId,
            user_id: userId,
            rating,
            review_text: reviewText,
        });
        return newReview;
    } catch (error) {
        console.error('Error creating review:', error);
        throw new Error('Could not create review');
    }
}

// Lấy danh sách review của một sản phẩm (có phân trang)
async function getReviewsByProduct(productId, limit = 5, offset = 0) {
    try {
        const { count, rows } = await Review.findAndCountAll({
            where: { product_id: productId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstname', 'lastname'], // Lấy thông tin cơ bản của User
                },
            ],
            order: [['created_at', 'DESC']], // Sắp xếp theo thời gian mới nhất
            limit,
            offset,
        });

        const reviews = rows.map(review => ({
            id: review.id,
            user: `${review.User.firstname} ${review.User.lastname}`,
            rating: review.rating,
            review_text: review.review_text,
            created_at: review.created_at,
        }));

        return {
            reviews,
            totalReviews: count,
            totalPages: Math.ceil(count / limit),
            currentPage: Math.floor(offset / limit) + 1,
        };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw new Error('Could not fetch reviews');
    }
}

// Tính điểm trung bình của một sản phẩm
async function getAverageRating(productId) {
    try {
        const result = await Review.findOne({
            where: { product_id: productId },
            attributes: [[Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average_rating']],
            raw: true,
        });
        return result?.average_rating ? parseFloat(result.average_rating).toFixed(2) : 0;
    } catch (error) {
        console.error('Error calculating average rating:', error);
        throw new Error('Could not calculate average rating');
    }
}

// Xóa một review
async function deleteReview(reviewId) {
    try {
        const result = await Review.destroy({
            where: { id: reviewId },
        });
        return result > 0; // Trả về true nếu xóa thành công
    } catch (error) {
        console.error('Error deleting review:', error);
        throw new Error('Could not delete review');
    }
}

// Lấy danh sách review của một người dùng
async function getReviewsByUser(userId) {
    try {
        const reviews = await Review.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Product,
                    attributes: ['id', 'product_name'], // Lấy thông tin cơ bản của sản phẩm
                },
            ],
            order: [['created_at', 'DESC']], // Sắp xếp theo thời gian mới nhất
        });

        return reviews.map(review => ({
            id: review.id,
            product: review.Product?.product_name || 'Unknown Product',
            rating: review.rating,
            review_text: review.review_text,
            created_at: review.created_at,
        }));
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        throw new Error('Could not fetch user reviews');
    }
}

// Export các hàm để sử dụng
module.exports = {
    createReview,
    getReviewsByProduct,
    getAverageRating,
    deleteReview,
    getReviewsByUser,
};
