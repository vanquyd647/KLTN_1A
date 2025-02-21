const express = require('express');
const router = express.Router();
const {
    addToFavorite,
    getFavorites, 
    removeFromFavorite,
    checkFavoriteStatus,
    transferFavorites
} = require('../controllers/favoriteController');

const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Quản lý danh sách yêu thích
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /v1/api/favorites/products/{productId}/favorite:
 *   get:
 *     summary: Kiểm tra trạng thái yêu thích của sản phẩm
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Trạng thái yêu thích của sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 *                   example: true
 */
router.get('/products/:productId/favorite', authMiddleware, checkFavoriteStatus);

/**
 * @swagger
 * /v1/api/favorites/favorites:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm yêu thích
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       product_id:
 *                         type: integer
 *                       product:
 *                         type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/favorites', authMiddleware, getFavorites);

/**
 * @swagger
 * /v1/api/favorites/products/{productId}/favorite:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     responses:
 *       201:
 *         description: Thêm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đã thêm vào danh sách yêu thích
 */
router.post('/products/:productId/favorite', authMiddleware, addToFavorite);

/**
 * @swagger
 * /v1/api/favorites/products/{productId}/favorite:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đã xóa khỏi danh sách yêu thích
 */
router.delete('/products/:productId/favorite', authMiddleware, removeFromFavorite);

/**
 * @swagger
 * /v1/api/favorites/favorites/transfer:
 *   post:
 *     summary: Chuyển danh sách yêu thích từ session sang tài khoản người dùng
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Chuyển danh sách yêu thích thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Đã chuyển 5 sản phẩm và xóa 5 sản phẩm từ session
 *                 data:
 *                   type: object
 *                   properties:
 *                     transferred:
 *                       type: integer
 *                       example: 5
 *                     deleted:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Lỗi khi chuyển danh sách
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/favorites/transfer', authMiddleware, transferFavorites);

module.exports = router;
