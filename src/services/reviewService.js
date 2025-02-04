/**
 * Review Service - Handles CRUD operations for reviews
 */
const { Op } = require('sequelize');
const { Review, Product, User } = require('../models'); // Ensure correct path

/**
 * Creates a new review
 * @param {Object} reviewData - Data for the new review
 * @param {number} reviewData.productId - ID of the product being reviewed
 * @param {number} reviewData.userId - ID of the user writing the review
 * @param {number} reviewData.rating - Rating given to the product
 * @param {string} reviewData.reviewText - Review text content
 * @returns {Promise<Object>} - The created review object
 * @throws {Error} - If review creation fails
 */
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

/**
 * Retrieves a paginated list of reviews for a product
 * @param {number} productId - ID of the product
 * @param {number} [limit=5] - Number of reviews per page
 * @param {number} [offset=0] - Offset for pagination
 * @returns {Promise<Object>} - Object containing reviews, total count, and pagination info
 * @throws {Error} - If retrieval fails
 */
async function getReviewsByProduct(productId, limit = 5, offset = 0) {
    try {
        const { count, rows } = await Review.findAndCountAll({
            where: { product_id: productId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstname', 'lastname'], // Get user details
                },
            ],
            order: [['created_at', 'DESC']], // Sort by newest first
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

/**
 * Calculates the average rating of a product
 * @param {number} productId - ID of the product
 * @returns {Promise<Object>} - Object containing average rating and total reviews
 * @throws {Error} - If calculation fails
 */
async function getAverageRating(productId) {
    try {
        const result = await Review.findOne({
            where: { product_id: productId },
            attributes: [[Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average_rating'],
            [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'total_reviews'],
            ],
            raw: true,
        });
        return {
            averageRating: result?.average_rating ? parseFloat(result.average_rating).toFixed(2) : 0,
            totalReviews: result?.total_reviews ? parseInt(result.total_reviews, 10) : 0,
        };
    } catch (error) {
        console.error('Error calculating average rating:', error);
        throw new Error('Could not calculate average rating');
    }
}

/**
 * Deletes a review
 * @param {number} reviewId - ID of the review to delete
 * @returns {Promise<boolean>} - True if deletion was successful, otherwise false
 * @throws {Error} - If deletion fails
 */
async function deleteReview(reviewId) {
    try {
        const result = await Review.destroy({
            where: { id: reviewId },
        });
        return result > 0; // Returns true if successful
    } catch (error) {
        console.error('Error deleting review:', error);
        throw new Error('Could not delete review');
    }
}

/**
 * Retrieves all reviews by a specific user
 * @param {number} userId - ID of the user
 * @returns {Promise<Object[]>} - Array of reviews written by the user
 * @throws {Error} - If retrieval fails
 */
async function getReviewsByUser(userId) {
    try {
        const reviews = await Review.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Product,
                    attributes: ['id', 'product_name'], // Get product details
                },
            ],
            order: [['created_at', 'DESC']], // Sort by newest first
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

// Export functions
module.exports = {
    createReview,
    getReviewsByProduct,
    getAverageRating,
    deleteReview,
    getReviewsByUser,
};
