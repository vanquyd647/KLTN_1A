"use strict";

/**
 * Review Service - Handles CRUD operations for reviews
 */
const { Op } = require('sequelize');
const logger = require('../configs/winston');
const { Review, Product, User } = require('../models'); // Ensure correct path

const reviewService = {
    /**
     * Creates a new review
     */
    async createReview({ productId, userId, rating, reviewText }) {
        try {
            const newReview = await Review.create({
                product_id: productId,
                user_id: userId,
                rating,
                review_text: reviewText,
            });
            return newReview;
        } catch (error) {
            logger.error('Error creating review:', error);
            console.error('Error creating review:', error);
            throw new Error('Could not create review');
        }
    },

    /**
     * Retrieves a paginated list of reviews for a product
     */
    async getReviewsByProduct(productId, limit = 5, offset = 0) {
        try {
            const { count, rows } = await Review.findAndCountAll({
                where: { product_id: productId },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'firstname', 'lastname'],
                    },
                ],
                order: [['created_at', 'DESC']],
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
            logger.error('Error fetching reviews:', error);
            console.error('Error fetching reviews:', error);
            throw new Error('Could not fetch reviews');
        }
    },

    /**
     * Calculates the average rating of a product
     */
    async getAverageRating(productId) {
        try {
            const result = await Review.findOne({
                where: { product_id: productId },
                attributes: [
                    [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average_rating'],
                    [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'total_reviews'],
                ],
                raw: true,
            });
            return {
                averageRating: result?.average_rating ? parseFloat(result.average_rating).toFixed(2) : 0,
                totalReviews: result?.total_reviews ? parseInt(result.total_reviews, 10) : 0,
            };
        } catch (error) {
            logger.error('Error calculating average rating:', error);
            console.error('Error calculating average rating:', error);
            throw new Error('Could not calculate average rating');
        }
    },

    /**
     * Deletes a review
     */
    async deleteReview(reviewId) {
        try {
            const result = await Review.destroy({
                where: { id: reviewId },
            });
            return result > 0;
        } catch (error) {
            logger.error('Error deleting review:', error);
            console.error('Error deleting review:', error);
            throw new Error('Could not delete review');
        }
    },

    /**
     * Retrieves all reviews by a specific user
     */
    async getReviewsByUser(userId) {
        try {
            const reviews = await Review.findAll({
                where: { user_id: userId },
                include: [
                    {
                        model: Product,
                        attributes: ['id', 'product_name'],
                    },
                ],
                order: [['created_at', 'DESC']],
            });

            return reviews.map(review => ({
                id: review.id,
                product: review.Product?.product_name || 'Unknown Product',
                rating: review.rating,
                review_text: review.review_text,
                created_at: review.created_at,
            }));
        } catch (error) {
            logger.error('Error fetching user reviews:', error);
            console.error('Error fetching user reviews:', error);
            throw new Error('Could not fetch user reviews');
        }
    },
};

// Export tất cả các function trong một object duy nhất
module.exports = reviewService;
