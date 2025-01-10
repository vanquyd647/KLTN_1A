// models/ProductSize.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductSize = sequelize.define('ProductSize', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'id',
            },
        },
        size_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'Sizes',
                key: 'id',
            },
        },
    }, {
        tableName: 'product_sizes',
        timestamps: false,
    });

    return ProductSize;
};
