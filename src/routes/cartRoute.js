const express = require('express');
const cartController = require('../controllers/cartController');
const ensureSession = require('../middlewares/ensureSession');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Ensure session middleware applied to all cart routes
router.use(ensureSession);

// Routes for guest users
router.post('/guest', cartController.createCartForGuest); // Create cart for guest user

// Routes for logged-in users
router.post('/user', authMiddleware, cartController.createCartForUser); // Create or retrieve a cart for logged-in user

// Cart management routes
router.get('/:id', cartController.getCartById); // Get cart details by ID

router.post('/:cartId/items', cartController.addItemToCart); // Add an item to a cart

router.delete('/items/:itemId', cartController.removeCartItem); // Remove an item from a cart

router.get('/:cartId/items', cartController.getCartItems); // Get all items in a cart

router.put('/item/:itemId', cartController.updateCartItemQuantity);

module.exports = router;
