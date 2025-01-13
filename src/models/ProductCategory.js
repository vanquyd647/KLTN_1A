// models/ProductCategory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductCategory = sequelize.define('ProductCategory', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
        },
        category_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
        },
    }, {
        tableName: 'product_categories',
        timestamps: false,
    });

    return ProductCategory;
};
