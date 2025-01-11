// models/ProductStock.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductStock = sequelize.define('ProductStock', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
        },
        size_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'sizes',
                key: 'id',
            },
        },
        color_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'colors',
                key: 'id',
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        tableName: 'product_stocks',
        timestamps: false,
    });

    return ProductStock;
};
