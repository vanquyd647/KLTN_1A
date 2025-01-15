const { Cart, Product, CartItem, Size, Color, ProductStock, Category } = require('../models'); // Điều chỉnh đường dẫn theo cấu trúc dự án
const { sequelize } = require('../models');
const sessionService = require('./sessionService'); // Assuming sessionService is in the same directory
const { v4: uuidv4 } = require('uuid');

const cartService = {

    async createCartForUser(userId, sessionId = null) {
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

    async getCartById(cartId) {
        return await Cart.findByPk(cartId, { include: CartItem });
    },

    async getCartsByUserId(userId) {
        return await Cart.findAll({
            where: {
                user_id: userId,
            },
            include: CartItem,
        });
    },

    // Add item to cart
    async addItemToCart(cartItemData) {
        try {
            console.log('cartItemData:', cartItemData);
            const { cart_id, product_id, size_id, color_id, quantity } = cartItemData;
            if (!cart_id || !product_id || !size_id || !color_id) {
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
            console.error('Error in cartService.addItemToCart:', error);
            throw error;
        }
    },

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
            throw error;
        }
    },


    async updateCart(cartId, updates) {
        const cart = await Cart.findByPk(cartId);
        if (!cart) return null;
        return await cart.update(updates);
    },

    async removeCartItem(cartItemId) {
        const deletedCount = await CartItem.destroy({ where: { id: cartItemId } });
        return deletedCount > 0;
    },
};

module.exports = cartService;
