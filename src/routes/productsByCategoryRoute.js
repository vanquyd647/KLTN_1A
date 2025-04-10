const express = require('express');
const { getProductsByCategory, updateProductCategories } = require('../controllers/productsByCategoryController');
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

/**
 * @swagger
 * /v1/api/products-by-category/product/{productId}/categories:
 *   put:
 *     summary: Update product categories
 *     tags: [ProductsByCategory]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of category IDs
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Categories updated successfully
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
 *                   example: "Cập nhật danh mục sản phẩm thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     product_name:
 *                       type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "categoryIds phải là một mảng"
 *       404:
 *         description: Product or categories not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy sản phẩm"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Lỗi máy chủ khi cập nhật danh mục sản phẩm"
 *                 error:
 *                   type: string
 */
router.put('/product/:productId/categories', updateProductCategories);

module.exports = router;
