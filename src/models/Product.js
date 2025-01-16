// models/Product.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        product_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        discount_price: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        is_new: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_featured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: DataTypes.ENUM('available', 'out_of_stock', 'discontinued'),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'products',
        timestamps: false,
    });

    return Product;
};
