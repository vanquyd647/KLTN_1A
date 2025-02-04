const express = require('express');
const cartController = require('../controllers/cartController');
const ensureSession = require('../middlewares/ensureSession');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Ensure session middleware applied to all cart routes
router.use(ensureSession);

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: API for managing shopping carts
 */

/**
 * @swagger
 * /v1/api/cart/guest:
 *   post:
 *     summary: Create a cart for a guest user
 *     tags: [Cart]
 *     responses:
 *       201:
 *         description: Guest cart created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/guest', cartController.createCartForGuest);

/**
 * @swagger
 * /v1/api/cart/user:
 *   post:
 *     summary: Create or retrieve a cart for a logged-in user
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Cart created or merged successfully
 *       500:
 *         description: Internal server error
 */
router.post('/user', authMiddleware, cartController.createCartForUser);

/**
 * @swagger
 * /v1/api/cart/{id}:
 *   get:
 *     summary: Get cart details by ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', cartController.getCartById);

/**
 * @swagger
 * /v1/api/cart/{cartId}/items:
 *   post:
 *     summary: Add an item to a cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *       500:
 *         description: Internal server error
 */
router.post('/:cartId/items', cartController.addItemToCart);

/**
 * @swagger
 * /v1/api/cart/items/{itemId}:
 *   delete:
 *     summary: Remove an item from a cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     responses:
 *       204:
 *         description: Cart item removed successfully
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/items/:itemId', cartController.removeCartItem);

/**
 * @swagger
 * /v1/api/cart/{cartId}/items:
 *   get:
 *     summary: Get all items in a cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:cartId/items', cartController.getCartItems);

module.exports = router;
