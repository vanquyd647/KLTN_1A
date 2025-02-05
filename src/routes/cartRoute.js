const express = require('express');
const {createCartForGuest, createCartForUser, getCartById, addItemToCart, removeCartItem, getCartItems, updateCartItemQuantity} = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: API for managing shopping carts
 */

/**
 * @swagger
 * /v1/api/carts/guest:
 *   post:
 *     summary: Create a cart for a guest user
 *     tags: [Cart]
 *     responses:
 *       201:
 *         description: Guest cart created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/guest', createCartForGuest);

/**
 * @swagger
 * /v1/api/carts/user:
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
router.post('/user', authMiddleware, createCartForUser);

/**
 * @swagger
 * /v1/api/carts/{id}:
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
router.get('/:id', getCartById);

/**
 * @swagger
 * /v1/api/carts/{cartId}/items:
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
router.post('/:cartId/items', addItemToCart);

/**
 * @swagger
 * /v1/api/carts/items/{itemId}:
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
router.delete('/items/:itemId', removeCartItem);

/**
 * @swagger
 * /v1/api/carts/{cartId}/items:
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
router.get('/:cartId/items', getCartItems);

/**
 * @swagger
 * /v1/api/carts/item/{itemId}:
 *   put:
 *     summary: Update the quantity of an item in a cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart item quantity updated successfully
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Internal server error
 */
router.put('/item/:itemId', updateCartItemQuantity);

module.exports = router;
