const express = require('express');
const { createProduct, getProducts, getProductsByPagination, getNewProductsByPagination, getNewProductsByPagination2, getFeaturedProductsByPagination, getFeaturedProductsByPagination2, getProductDetail, updateProduct, deleteProduct, searchProductsByNameAndColor } = require('../controllers/productController');
const rateLimiter = require('../middlewares/rateLimiter');

const router = express.Router();

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
router.post('/', rateLimiter, createProduct);

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
router.get('/', rateLimiter, getProducts);

/**
 * @swagger
 * /v1/api/products/pagination:
 *   get:
 *     summary: Get products with pagination and filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by product name
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Filter by category IDs (comma-separated)
 *       - in: query
 *         name: colors
 *         schema:
 *           type: string
 *         description: Filter by color IDs (comma-separated)
 *       - in: query
 *         name: sizes
 *         schema:
 *           type: string
 *         description: Filter by size IDs (comma-separated)
 *       - in: query
 *         name: priceRange
 *         schema:
 *           type: string
 *         example: "0-1000000"
 *         description: Price range filter (format min-max)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, oldest]
 *         description: Sort products
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       404:
 *         description: No products found
 *       500:
 *         description: Internal server error
 */
router.get('/pagination', rateLimiter, getProductsByPagination);


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
router.get('/new', getNewProductsByPagination);

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
router.get('/news', getNewProductsByPagination2);

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
router.get('/featured', getFeaturedProductsByPagination);

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
router.get('/featureds', getFeaturedProductsByPagination2);

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
router.get('/:slug', rateLimiter, getProductDetail);

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
router.put('/:slug', rateLimiter, updateProduct);

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
router.delete('/:slug', rateLimiter, deleteProduct);

/**
 * @swagger
 * /v1/api/products/search/name-color:
 *   get:
 *     summary: Tìm kiếm sản phẩm theo tên và màu sắc
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: Từ khóa tìm kiếm (tên sản phẩm hoặc màu sắc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng sản phẩm trên mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: Sắp xếp kết quả (mới nhất hoặc cũ nhất)
 *     responses:
 *       200:
 *         description: Tìm kiếm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       product_name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       discount_price:
 *                         type: number
 *                       status:
 *                         type: string
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                       productColors:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             color:
 *                               type: string
 *                             hex_code:
 *                               type: string
 *                             image:
 *                               type: string
 *                       highlights:
 *                         type: object
 *                         properties:
 *                           product_name:
 *                             type: array
 *                             items:
 *                               type: string
 *                           colors:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 color:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                       score:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Thiếu từ khóa tìm kiếm
 *       500:
 *         description: Lỗi server
 */
router.get('/search/name-color', searchProductsByNameAndColor);



module.exports = router;
