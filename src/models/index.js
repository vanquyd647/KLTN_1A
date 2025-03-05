// models/index.js
const { Sequelize } = require('sequelize');
const sequelize = require('../db/connect_db');
const defineProduct = require('./Product');
const defineColor = require('./Color');
const defineSize = require('./Size');
const defineProductStock = require('./ProductStock');
// const defineProductImage = require('./ProductImage');
const defineProductSize = require('./ProductSize');
const defineProductColor = require('./ProductColor');
const defineAddress = require('./Address');
const defineUser = require('./User');
const defineRole = require('./Role');
const defineUserRole = require('./UserRole');
const defineCategory = require('./Category');
const defineProductCategory = require('./ProductCategory');
const defineToken = require('./Token');
const defineSession = require('./Session');
const defineCart = require('./Cart');
const defineCartItem = require('./CartItem');
const defineOrder = require('./Order');
const defineOrderDetail = require('./OrderDetails');
const defineOrderItem = require('./OrderItem');
const definePayment = require('./Payment');
const defineReview = require('./Review');
const definePaymentLog = require('./PaymentLog');
const defineCarrier = require('./Carrier');
const defineRevenue = require('./Revenue');
const defineFavorite = require('./Favorite');
const defineCoupon = require('./Coupon');
const defineBlog = require('./Blog');


const models = {
    Product: defineProduct(sequelize),
    Color: defineColor(sequelize),
    Size: defineSize(sequelize),
    ProductStock: defineProductStock(sequelize),
    // ProductImage: defineProductImage(sequelize),
    ProductSize: defineProductSize(sequelize),
    ProductColor: defineProductColor(sequelize),
    Address: defineAddress(sequelize),
    User: defineUser(sequelize),
    Role: defineRole(sequelize),
    UserRole: defineUserRole(sequelize),
    Category: defineCategory(sequelize),
    ProductCategory: defineProductCategory(sequelize),
    Token: defineToken(sequelize),
    Session: defineSession(sequelize),
    Cart: defineCart(sequelize),
    CartItem: defineCartItem(sequelize),
    Order: defineOrder(sequelize),
    OrderDetails: defineOrderDetail(sequelize),
    OrderItem: defineOrderItem(sequelize),
    Payment: definePayment(sequelize),
    Review: defineReview(sequelize),
    PaymentLog: definePaymentLog(sequelize),
    Carrier: defineCarrier(sequelize),
    Revenue: defineRevenue(sequelize),
    Favorite: defineFavorite(sequelize),
    Coupon: defineCoupon(sequelize),
    Blog: defineBlog(sequelize),


};

const {
    Product,
    Color,
    Size,
    ProductStock,
    Address,
    // ProductImage,
    ProductSize,
    ProductColor,
    User,
    Role,
    UserRole,
    Category,
    ProductCategory,
    Token,
    Session,
    Cart,
    CartItem,
    Order,
    OrderDetails,
    OrderItem,
    Payment,
    Review,
    PaymentLog,
    Carrier,
    Revenue,
    Favorite,
    Coupon,
    Blog,
} = models;

// Các quan hệ giữa các mô hình
Product.hasMany(ProductStock, { foreignKey: 'product_id' });
Product.belongsToMany(Size, { through: ProductSize, foreignKey: 'product_id', otherKey: 'size_id', as: 'productSizes' });
Product.belongsToMany(Color, { through: ProductColor, foreignKey: 'product_id', otherKey: 'color_id', as: 'productColors' });

// Quan hệ giữa Color và các mô hình khác
Color.belongsToMany(Product, { through: ProductColor, foreignKey: 'color_id', otherKey: 'product_id', as: 'products' });
Color.hasMany(ProductStock, { foreignKey: 'color_id' });

// Quan hệ giữa Size và các mô hình khác
Size.belongsToMany(Product, { through: ProductSize, foreignKey: 'size_id', otherKey: 'product_id', as: 'products' });
Size.hasMany(ProductStock, { foreignKey: 'size_id' });

// Quan hệ giữa ProductStock và các mô hình khác
ProductStock.belongsTo(Product, { foreignKey: 'product_id' });
ProductStock.belongsTo(Color, { foreignKey: 'color_id' });
ProductStock.belongsTo(Size, { foreignKey: 'size_id' });

// Product and Category relationships
Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'product_id', otherKey: 'category_id', as: 'categories', });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'category_id', otherKey: 'product_id', as: 'products', });

// Quan hệ giữa User và Role
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id' });

// Quan hệ giữa Token và User
Token.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Token, { foreignKey: 'user_id' });

// Quan hệ giữa Session và User
Session.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Session, { foreignKey: 'user_id' });

// Mối quan hệ giữa Cart và User
Cart.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Cart, { foreignKey: 'user_id' });

// Mối quan hệ giữa Cart và CartItem
User.hasOne(Cart, { foreignKey: 'user_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });

Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });

Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Size.hasMany(CartItem, { foreignKey: 'size_id' });
CartItem.belongsTo(Size, { foreignKey: 'size_id', as: 'size' });

Color.hasMany(CartItem, { foreignKey: 'color_id' });
CartItem.belongsTo(Color, { foreignKey: 'color_id', as: 'color' });

// Mối quan hệ giữa Order và User
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasOne(OrderDetails, { foreignKey: 'order_id', as: 'orderDetails' });
OrderDetails.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Size.hasMany(OrderItem, { foreignKey: 'size_id' });
OrderItem.belongsTo(Size, { foreignKey: 'size_id' });

Color.hasMany(OrderItem, { foreignKey: 'color_id' });
OrderItem.belongsTo(Color, { foreignKey: 'color_id' });

// Mối quan hệ giữa Order và Payment
Order.hasOne(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

// Mối quan hệ giữa Review và Product, User
Product.hasMany(Review, { foreignKey: 'product_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });


// Mối quan hệ giữa User và Address
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Mối quan hệ giữa Order và PaymentLog
Order.hasMany(PaymentLog, { foreignKey: 'order_id', as: 'paymentLogs', onDelete: 'CASCADE', onUpdate: 'CASCADE', });
PaymentLog.belongsTo(Order, { foreignKey: 'order_id', as: 'order', onDelete: 'CASCADE', onUpdate: 'CASCADE', });

// Mối quan hệ giữa Session và Cart
Session.hasMany(Cart, { foreignKey: 'session_id', as: 'carts' });
Cart.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// Mối quan hệ giữa CartItem và ProductStock
CartItem.belongsTo(ProductStock, {
    foreignKey: 'product_id', // Khóa ngoại liên kết
    targetKey: 'product_id', // Trường được tham chiếu trong ProductStock
    as: 'stock', // Alias để sử dụng trong truy vấn
});
ProductStock.hasMany(CartItem, {
    foreignKey: 'product_id', // Khóa ngoại từ CartItem
    sourceKey: 'product_id', // Trường trong ProductStock
    as: 'cartItems', // Alias nếu cần
});

// Ensure ProductCategory is properly defined
ProductCategory.belongsTo(Product, { foreignKey: 'product_id' });
ProductCategory.belongsTo(Category, { foreignKey: 'category_id' });
Product.hasMany(ProductCategory, { foreignKey: 'product_id' });
Category.hasMany(ProductCategory, { foreignKey: 'category_id' });

Order.belongsTo(Carrier, { foreignKey: 'carrier_id' });
Carrier.hasMany(Order, { foreignKey: 'carrier_id' });

// Mối quan hệ giữa UserRole và User, Role
UserRole.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
UserRole.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

// Mối quan hệ giữa User và UserRole
Role.hasMany(UserRole, { foreignKey: 'role_id', as: 'userRoles' });
User.hasMany(UserRole, { foreignKey: 'user_id', as: 'userRoles' });

// Thêm vào phần quan hệ trong index.js
Revenue.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
});

Revenue.belongsTo(Payment, {
    foreignKey: 'payment_id',
    as: 'payment'
});

Order.hasOne(Revenue, {
    foreignKey: 'order_id',
    as: 'revenue'
});

Payment.hasOne(Revenue, {
    foreignKey: 'payment_id',
    as: 'revenue'
});

// Quan hệ giữa User và Favorite
User.hasMany(models.Favorite, {
    foreignKey: 'user_id',
    as: 'favorites'
});
Favorite.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// Quan hệ giữa Product và Favorite 
Product.hasMany(models.Favorite, {
    foreignKey: 'product_id',
    as: 'favorites'
});
Favorite.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

Order.belongsTo(Coupon, {
    foreignKey: 'coupon_id',
    as: 'coupon'
});

Coupon.hasMany(Order, {
    foreignKey: 'coupon_id',
    as: 'orders'
});

Blog.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'author'
});

User.hasMany(Blog, {
    foreignKey: 'user_id',
    as: 'blogs'
});

module.exports = {
    ...models,
    sequelize,
};
