const express = require('express');
const {
    createReviewHandler,
    getProductReviewsHandler,
    getAverageRatingHandler,
    deleteReviewHandler,
} = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API for managing product reviews
 */

/**
 * @swagger
 * /v1/api/reviews:
 *   post:
 *     summary: Create a new product review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *               - reviewText
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product being reviewed
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               reviewText:
 *                 type: string
 *                 description: Review text content
 *     responses:
 *       201:
 *         description: Review created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware, createReviewHandler);

/**
 * @swagger
 * /v1/api/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/product/:productId', getProductReviewsHandler);

/**
 * @swagger
 * /v1/api/reviews/product/{productId}/average-rating:
 *   get:
 *     summary: Get the average rating of a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     responses:
 *       200:
 *         description: Average rating retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/product/:productId/average-rating', getAverageRatingHandler);

/**
 * @swagger
 * /v1/api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to be deleted
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, deleteReviewHandler);

module.exports = router;
