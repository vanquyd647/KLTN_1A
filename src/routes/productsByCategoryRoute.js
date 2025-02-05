const express = require('express');
const {getProductsByCategory} = require('../controllers/productsByCategoryController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProductsByCategory
 *   description: API to get products by category
 */

/**
 * @swagger
 * /v1/api/products-by-category/{categoryId}:
 *   get:
 *     summary: Get products by category
 *     tags: [ProductsByCategory]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting parameter (e.g., price, rating)
 *       - in: query
 *         name: priceRange
 *         schema:
 *           type: string
 *         description: Price range filter (e.g., "100-500" for min-max price)
 *       - in: query
 *         name: colorIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of color IDs (e.g., "1,2,3")
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách sản phẩm thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       rating:
 *                         type: number
 *                       colors:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get('/:categoryId', getProductsByCategory);

module.exports = router;
