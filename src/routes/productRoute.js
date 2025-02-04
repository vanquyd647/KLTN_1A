const express = require('express');
const productController = require('../controllers/productController');
const rateLimiter = require('../middlewares/rateLimiter');
const ensureSession = require('../middlewares/ensureSession');

const router = express.Router();
router.use(ensureSession);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API for managing products
 */

/**
 * @swagger
 * /v1/api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - price
 *               - status
 *               - categories
 *               - colors
 *               - sizes
 *               - stock
 *             properties:
 *               product_name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discount_price:
 *                 type: number
 *               is_new:
 *                 type: boolean
 *               is_featured:
 *                 type: boolean
 *               status:
 *                 type: string
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     color:
 *                       type: string
 *                     hex_code:
 *                       type: string
 *                     image:
 *                       type: string
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *               stock:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request, missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', rateLimiter, productController.createProduct);

/**
 * @swagger
 * /v1/api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       404:
 *         description: No products found
 *       500:
 *         description: Internal server error
 */
router.get('/', rateLimiter, productController.getProducts);

/**
 * @swagger
 * /v1/api/products/pagination:
 *   get:
 *     summary: Get products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Paginated products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/pagination', rateLimiter, productController.getProductsByPagination);

/**
 * @swagger
 * /v1/api/products/new:
 *   get:
 *     summary: Get new products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: New products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/new', productController.getNewProductsByPagination);

/**
 * @swagger
 * /v1/api/products/news:
 *   get:
 *     summary: Get new products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: New products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/news', productController.getNewProductsByPagination2);

/**
 * @swagger
 * /v1/api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/featured', productController.getFeaturedProductsByPagination);

/**
 * @swagger
 * /v1/api/products/featureds:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/featureds', productController.getFeaturedProductsByPagination2);

/**
 * @swagger
 * /v1/api/products/{slug}:
 *   get:
 *     summary: Get product details by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the product
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:slug', rateLimiter, productController.getProductDetail);

/**
 * @swagger
 * /v1/api/products/{slug}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discount_price:
 *                 type: number
 *               is_featured:
 *                 type: boolean
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/:slug', rateLimiter, productController.updateProduct);

/**
 * @swagger
 * /v1/api/products/{slug}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the product to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:slug', rateLimiter, productController.deleteProduct);

module.exports = router;
