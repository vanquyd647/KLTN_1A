"use strict";

const { Cart, Product, CartItem, Size, Color, ProductStock, Category } = require('../models'); // Điều chỉnh đường dẫn theo cấu trúc dự án
const { sequelize } = require('../models');
const sessionService = require('./sessionService'); // Assuming sessionService is in the same directory
const { v4: uuidv4 } = require('uuid');
const logger = require('../configs/winston');

const cartService = {

    /**
     * Creates or retrieves an active shopping cart for a user.
     * If a session-based cart exists, it merges it with the user's cart.
     *
     * @async
     * @function createCartForUser
     * @param {number} userId - The unique ID of the user.
     * @param {string|null} [sessionId=null] - The optional session ID for merging carts.
     * @returns {Promise<Object>} A promise that resolves to the user's active cart.
     * @throws {Error} Throws an error if `userId` is not provided or if an issue occurs during cart creation or merging.
     *
     * @example
     * createCartForUser(1, 'session123')
     *  .then(cart => console.log(cart))
     *  .catch(error => console.error(error));
     */
    async createCartForUser(userId, sessionId = null) {
        if (!userId) {
            logger.error('User ID is required', { error }); 
            throw new Error('User ID is required');
        }
        // Lấy giỏ hàng của người dùng nếu tồn tại
        let userCart = await Cart.findOne({
            where: {
                user_id: userId,
                status: 'active',
            },
            include: CartItem,
        });

        if (sessionId) {
            // Lấy giỏ hàng dựa trên session nếu tồn tại
            const sessionCart = await Cart.findOne({
                where: {
                    session_id: sessionId,
                    status: 'active',
                },
                include: CartItem,
            });

            if (sessionCart) {
                if (userCart) {
                    // Gộp các sản phẩm trong cart session vào cart của người dùng
                    for (const sessionItem of sessionCart.CartItems) {
                        const existingItem = await CartItem.findOne({
                            where: {
                                cart_id: userCart.id,
                                product_id: sessionItem.product_id,
                                size_id: sessionItem.size_id,
                                color_id: sessionItem.color_id,
                            },
                        });

                        if (existingItem) {
                            // Nếu sản phẩm đã tồn tại, cập nhật số lượng
                            await existingItem.update({
                                quantity: existingItem.quantity + sessionItem.quantity,
                            });
                        } else {
                            // Nếu sản phẩm chưa tồn tại, thêm mới
                            await CartItem.create({
                                cart_id: userCart.id,
                                product_id: sessionItem.product_id,
                                size_id: sessionItem.size_id,
                                color_id: sessionItem.color_id,
                                quantity: sessionItem.quantity,
                                status: sessionItem.status,
                                is_selected: sessionItem.is_selected,
                            });
                        }
                    }

                    // Xóa cart session sau khi gộp
                    await sessionCart.update({ status: 'archived', session_id: null });
                } else {
                    // Nếu người dùng không có cart, chuyển cart session thành cart của người dùng
                    await sessionCart.update({ user_id: userId, session_id: null });
                    userCart = sessionCart;
                }
            }
        }

        // Nếu không có cart nào (cả userCart và sessionCart), tạo mới
        if (!userCart) {
            userCart = await Cart.create({
                user_id: userId,
                session_id: null,
                status: 'active',
            });
        }

        return userCart;
    },

    /**
     * Creates a new cart for a guest user based on their session information
     * 
     * @param {Object} data - The guest user data
     * @param {string} [data.session_id] - Optional session ID. If not provided, a new UUID will be generated
     * @param {string} data.ip_address - IP address of the guest user
     * @param {string} data.user_agent - User agent string from the browser
     * @throws {Error} When guest already has an active cart
     * @returns {Promise<Cart>} The newly created cart instance
     */
    async createCartForGuest(data) {
        // Get or create a session for the guest user
        const session = await sessionService.getOrCreateGuestSession({
            session_id: data.session_id || uuidv4(),
            ip_address: data.ip_address,
            user_agent: data.user_agent,
        });

        // Check if the session already has an active cart
        const existingCart = await Cart.findOne({
            where: {
                session_id: session.session_id,
                status: 'active',
            },
        });

        if (existingCart) {
            logger.error('Guest already has an active cart', { error });
            throw new Error('Guest already has an active cart.');
        }

        // Create a new cart for the guest user
        const cart = await Cart.create({
            user_id: null, // Guest user
            session_id: session.session_id,
            status: 'active',
        });

        return cart;
    },

    /**
     * Retrieves a shopping cart by its ID, including its associated cart items.
     *
     * @async
     * @function getCartById
     * @param {number} cartId - The unique ID of the shopping cart.
     * @returns {Promise<Object|null>} A promise that resolves to the cart object if found, or `null` if not found.
     * @throws {Error} Throws an error if an issue occurs while retrieving the cart.
     *
     * @example
     * getCartById(1)
     *  .then(cart => console.log(cart))
     *  .catch(error => console.error(error));
     */
    async getCartById(cartId) {
        return await Cart.findByPk(cartId, { include: CartItem });
    },

    /**
     * Retrieves all shopping carts associated with a specific user.
     *
     * @async
     * @function getCartsByUserId
     * @param {number} userId - The unique ID of the user.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of cart objects associated with the user.
     * @throws {Error} Throws an error if an issue occurs while retrieving the carts.
     *
     * @example
     * getCartsByUserId(1)
     *  .then(carts => console.log(carts))
     *  .catch(error => console.error(error));
     */
    async getCartsByUserId(userId) {
        return await Cart.findAll({
            where: {
                user_id: userId,
            },
            include: CartItem,
        });
    },

    /**
     * Adds a new item to the shopping cart.
     * If an item with the same product, size, and color already exists, the quantity is updated.
     * If the item does not exist, a new cart item is created.
     * 
     * @async
     * @function addItemToCart
     * @param {Object} cartItemData - The cart item data to add
     * @param {number} cartItemData.cart_id - The ID of the cart to add the item to
     * @param {number} cartItemData.product_id - The ID of the product
     * @param {number} cartItemData.size_id - The ID of the size
     * @param {number} cartItemData.color_id - The ID of the color
     * @param {number} cartItemData.quantity - The quantity of the item
     * @returns {Promise<Object>} A promise that resolves to the newly created or updated cart item
     * @throws {Error} Throws an error if the required fields are missing or if an issue occurs while adding the item
     * @example
     * addItemToCart({
     *  cart_id: 1,
     * product_id: 5,
     * size_id: 2,
     * color_id: 3,
     * quantity: 2
     *  });
     *  .then(cartItem => console.log(cartItem))
     *  .catch(error => console.error(error));
     */
    async addItemToCart(cartItemData) {
        try {
            console.log('cartItemData:', cartItemData);
            const { cart_id, product_id, size_id, color_id, quantity } = cartItemData;
            if (!cart_id || !product_id || !size_id || !color_id) {
                logger.error('Missing required fields', { error });
                console.log('Missing required fields');
            }

            console.log('Checking for existing cart item:', { cart_id, product_id, size_id, color_id });

            const existingCartItem = await CartItem.findOne({
                where: { cart_id, product_id, size_id, color_id },
            });

            if (existingCartItem) {
                console.log('Updating quantity for existing cart item');
                return await existingCartItem.update({
                    quantity: existingCartItem.quantity + quantity,
                });
            }

            console.log('Creating a new cart item');
            return await CartItem.create(cartItemData);
        } catch (error) {
            logger.error('Error in cartService.addItemToCart:', error);
            console.error('Error in cartService.addItemToCart:', error);
            throw error;
        }
    },

    /**
     * Retrieves all items in a shopping cart, including product details, size, color, and stock information.
     *
     * @async
     * @function getCartItems
     * @param {number} cartId - The unique ID of the shopping cart.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of cart item objects with product, size, color, and stock details.
     * @throws {Error} Throws an error if retrieving cart items fails.
     *
     * @example
     * getCartItems(1)
     *  .then(items => console.log(items))
     *  .catch(error => console.error(error));
     */
    async getCartItems(cartId) {
        try {
            const cartItems = await CartItem.findAll({
                where: { cart_id: cartId },
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'product_name', 'slug', 'description', 'price', 'discount_price', 'is_featured', 'status'],
                        include: [
                            {
                                model: Category,
                                as: 'categories',
                                attributes: ['id', 'name'],
                                through: { attributes: [] },
                            },
                            {
                                model: Color,
                                as: 'productColors',
                                attributes: ['id', 'color', 'hex_code'],
                                through: { attributes: ['image'] },
                            },
                            {
                                model: Size,
                                as: 'productSizes',
                                attributes: ['id', 'size'],
                                through: { attributes: [] },
                            },
                        ],
                    },
                    {
                        model: Size,
                        as: 'size',
                        attributes: ['id', 'size'],
                    },
                    {
                        model: Color,
                        as: 'color',
                        attributes: ['id', 'color', 'hex_code'],
                    },
                    {
                        model: ProductStock,
                        as: 'stock', // Alias phải khớp với định nghĩa quan hệ
                        attributes: ['quantity'],
                        where: {
                            product_id: sequelize.col('CartItem.product_id'),
                            size_id: sequelize.col('CartItem.size_id'),
                            color_id: sequelize.col('CartItem.color_id'),
                        },
                        required: false, // Để tránh lỗi nếu không có bản ghi phù hợp
                    },
                ],
            });

            return cartItems;
        } catch (error) {
            logger.error('Error in getCartItems:', error);
            console.error('Error in getCartItems:', error);
            throw error;
        }
    },

    /**
     * Updates a shopping cart with the provided data.
     *
     * @async
     * @function updateCart
     * @param {number} cartId - The unique ID of the shopping cart to update.
     * @param {Object} updates - An object containing the fields to update.
     * @returns {Promise<Object|null>} A promise that resolves to the updated cart object, or `null` if the cart is not found.
     * @throws {Error} Throws an error if updating the cart fails.
     *
     * @example
     * updateCart(1, { status: 'inactive' })
     *  .then(updatedCart => console.log(updatedCart))
     *  .catch(error => console.error(error));
     */
    async updateCart(cartId, updates) {
        const cart = await Cart.findByPk(cartId);
        if (!cart) return null;
        return await cart.update(updates);
    },

    /**
     * Removes a cart item from the shopping cart.
     *
     * @async
     * @function removeCartItem
     * @param {number} cartItemId - The unique ID of the cart item to be removed.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the cart item was successfully removed, otherwise `false`.
     * @throws {Error} Throws an error if the removal process fails.
     *
     * @example
     * removeCartItem(1)
     *  .then(success => console.log(success ? 'Cart item removed' : 'Cart item not found'))
     *  .catch(error => console.error(error));
     */
    async removeCartItem(cartItemId) {
        const deletedCount = await CartItem.destroy({ where: { id: cartItemId } });
        return deletedCount > 0;
    },

    /**
     * Updates the quantity of a cart item and retrieves the updated cart item with detailed information.
     *
     * @async
     * @function updateCartItemQuantity
     * @param {number} cartItemId - The unique ID of the cart item.
     * @param {number} newQuantity - The new quantity to set for the cart item.
     * @returns {Promise<Object>} A promise that resolves to the updated cart item object with product, size, color, and stock details.
     * @throws {Error} Throws an error if the cart item is not found, the quantity is invalid, or if an issue occurs during the update.
     *
     * @example
     * updateCartItemQuantity(1, 5)
     *  .then(updatedItem => console.log(updatedItem))
     *  .catch(error => console.error(error));
     */
    async updateCartItemQuantity(cartItemId, newQuantity) {
        try {
            // Tìm cart item theo ID, kèm thông tin liên kết sản phẩm
            const cartItem = await CartItem.findByPk(cartItemId, {
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'product_name', 'slug', 'description', 'price', 'discount_price'],
                        include: [
                            {
                                model: Color,
                                as: 'productColors',
                                attributes: ['id', 'color', 'hex_code'],
                                through: {
                                    attributes: ['image'], // Bao gồm trường image từ bảng ProductColor
                                },
                            },
                        ],
                    },
                    {
                        model: Size,
                        as: 'size',
                        attributes: ['id', 'size'],
                    },
                    {
                        model: Color,
                        as: 'color',
                        attributes: ['id', 'color', 'hex_code'],
                    },
                    {
                        model: ProductStock,
                        as: 'stock',
                        attributes: ['quantity'],
                        where: {
                            product_id: sequelize.col('CartItem.product_id'),
                            size_id: sequelize.col('CartItem.size_id'),
                            color_id: sequelize.col('CartItem.color_id'),
                        },
                        required: false,
                    },
                ],
            });

            if (!cartItem) {
                logger.error('Cart item not found', { error });
                throw new Error('Cart item not found.');
            }

            if (newQuantity <= 0) {
                logger.error('Quantity must be greater than 0', { error });
                throw new Error('Quantity must be greater than 0.');
            }

            // Cập nhật số lượng trong giỏ hàng
            await cartItem.update({ quantity: newQuantity });

            // Lấy lại cart item với thông tin đầy đủ
            const updatedCartItem = await CartItem.findByPk(cartItemId, {
                include: [
                    {
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'product_name', 'slug', 'description', 'price', 'discount_price'],
                        include: [
                            {
                                model: Color,
                                as: 'productColors',
                                attributes: ['id', 'color', 'hex_code'],
                                through: {
                                    attributes: ['image'], // Bao gồm trường image từ bảng ProductColor
                                },
                            },
                        ],
                    },
                    {
                        model: Size,
                        as: 'size',
                        attributes: ['id', 'size'],
                    },
                    {
                        model: Color,
                        as: 'color',
                        attributes: ['id', 'color', 'hex_code'],
                    },
                    {
                        model: ProductStock,
                        as: 'stock',
                        attributes: ['quantity'],
                        where: {
                            product_id: sequelize.col('CartItem.product_id'),
                            size_id: sequelize.col('CartItem.size_id'),
                            color_id: sequelize.col('CartItem.color_id'),
                        },
                        required: false,
                    },
                ],
            });

            return updatedCartItem;
        } catch (error) {
            logger.error('Error in updateCartItemQuantity:', error);
            console.error('Error in updateCartItemQuantity:', error);
            throw error;
        }
    },

    /**
     * Removes specific pending cart items based on product, size, color, and quantity.
     *
     * @async
     * @function removeSpecificPendingCartItem
     * @param {number} cartId - The ID of the cart.
     * @param {number} productId - The ID of the product.
     * @param {number} sizeId - The ID of the size.
     * @param {number} colorId - The ID of the color.
     * @param {number} quantity - The quantity to match.
     * @returns {Promise<number>} The number of items removed.
     * @throws {Error} Throws an error if the removal process fails.
     */
    // Trong cartService.js - Sửa lại hàm removeSpecificPendingCartItem

    async removeSpecificPendingCartItem(cartId, productId, sizeId, colorId) {
        console.log('Attempting to delete cart item with:', {
            cartId,
            productId,
            sizeId,
            colorId
        });

        try {
            // Kiểm tra xem cart item có tồn tại không trước khi xóa
            const cartItem = await CartItem.findOne({
                where: {
                    cart_id: cartId,
                    product_id: productId,
                    size_id: sizeId,
                    color_id: colorId
                }
            });

            if (!cartItem) {
                console.log('Cart item not found:', {
                    cartId,
                    productId,
                    sizeId,
                    colorId
                });
                return 0;
            }

            // Thực hiện xóa
            const deletedCount = await CartItem.destroy({
                where: {
                    cart_id: cartId,
                    product_id: productId,
                    size_id: sizeId,
                    color_id: colorId
                }
            });

            console.log('Deleted count:', deletedCount);
            return deletedCount;
        } catch (error) {
            logger.error('❌ Error in removeSpecificPendingCartItem:', error);
            console.error('❌ Error in removeSpecificPendingCartItem:', error);
            throw error;
        }
    }

};

module.exports = cartService;
