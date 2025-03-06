"use strict";

const cartService = require('../services/cartService'); // Adjust the path based on your project structure

// Create or retrieve a cart for a logged-in user
const createCartForUser = async (req, res) => {
    try {
        const  userId  = req.userId;
        const sessionId = req.sessionId;

        console.log('222222222222222222222',sessionId);

        if (!userId) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'User ID is required',
                data: null,
            });
        }

        const cart = await cartService.createCartForUser(userId, sessionId);
        res.status(201).json({
            status: 'success',
            code: 201,
            message: 'Cart created or merged successfully',
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error',
            data: null,
        });
    }
};

// Create a cart for a guest user
const createCartForGuest = async (req, res) => {
    try {
        const sessionData = {
            session_id: req.sessionId || uuidv4(),
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        };

        const cart = await cartService.createCartForGuest(sessionData);

        res.cookie('sessionId', sessionData.session_id, { httpOnly: true, maxAge: 3600 * 1000 });
        res.status(201).json({
            status: 'success',
            code: 201,
            message: 'Guest cart created successfully',
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error',
            data: null,
        });
    }
};

// Get cart details by ID
const getCartById = async (req, res) => {
    try {
        const { id } = req.params;
        const cart = await cartService.getCartById(id);

        if (!cart) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Cart not found',
                data: null,
            });
        }

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Cart retrieved successfully',
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error',
            data: null,
        });
    }
};

// Add an item to a cart
const addItemToCart = async (req, res) => {
    try {
        console.log('Request method:', req.method);
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);

        const { cartId } = req.params;

        if (!cartId) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Cart ID is required',
                data: null,
            });
        }

        const cartItemData = { ...req.body, cart_id: cartId };
        const cartItem = await cartService.addItemToCart(cartItemData);

        res.status(201).json({
            status: 'success',
            code: 201,
            message: 'Item added to cart successfully',
            data: cartItem,
        });
    } catch (error) {
        console.error('Error in addItemToCart controller:', error.message);
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error',
            data: null,
        });
    }
};

// Remove an item from a cart
const removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        if (!itemId) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Item ID is required',
                data: null,
            });
        }

        const success = await cartService.removeCartItem(itemId);

        if (!success) {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Cart item not found',
                data: null,
            });
        }

        res.status(204).json({
            status: 'success',
            code: 204,
            message: 'Cart item removed successfully',
            data: null,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error',
            data: null,
        });
    }
};

// Get all items in a cart
const getCartItems = async (req, res) => {
    try {
        const { cartId } = req.params;
        const items = await cartService.getCartItems(cartId);

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Cart items retrieved successfully',
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error',
            data: null,
        });
    }
};

// Update cart item quantity
const updateCartItemQuantity = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        const updatedCartItem = await cartService.updateCartItemQuantity(itemId, quantity);

        res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Cart item quantity updated successfully.',
            data: updatedCartItem,
        });
    } catch (error) {
        console.error('Error in updateCartItemQuantity controller:', error.message);
        res.status(500).json({
            status: 'error',
            code: 500,
            message: error.message || 'Internal server error.',
            data: null,
        });
    }
};

// Export all functions
module.exports = {
    createCartForUser,
    createCartForGuest,
    getCartById,
    addItemToCart,
    removeCartItem,
    getCartItems,
    updateCartItemQuantity
};
