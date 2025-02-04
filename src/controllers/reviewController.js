"use strict";

const { createReview, getReviewsByProduct, getAverageRating, deleteReview } = require('../services/reviewService');

const createReviewHandler = async (req, res) => {
    try {
        const { productId, rating, reviewText } = req.body;
        const userId = req.userId; // Lấy userId từ middleware authenticateToken

        const review = await createReview({ productId, userId, rating, reviewText });
        res.status(201).json({
            status: 'success',
            data: review,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};

const getProductReviewsHandler = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { page = 1, limit = 5 } = req.query; // Lấy trang và giới hạn từ query params

        const offset = (page - 1) * limit; // Tính offset dựa trên trang hiện tại

        const result = await getReviewsByProduct(productId, parseInt(limit), parseInt(offset));

        res.status(200).json({
            status: 'success',
            data: result.reviews,
            meta: {
                totalReviews: result.totalReviews,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};


const getAverageRatingHandler = async (req, res) => {
    try {
        const productId = req.params.productId;

        const averageRating = await getAverageRating(productId);
        res.status(200).json({
            status: 'success',
            data: { averageRating },
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};

const deleteReviewHandler = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const success = await deleteReview(reviewId);

        if (success) {
            res.status(200).json({
                status: 'success',
                message: 'Review deleted successfully.',
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: 'Review not found.',
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};

module.exports = {
    createReviewHandler,
    getProductReviewsHandler,
    getAverageRatingHandler,
    deleteReviewHandler,
};
