// models/ProductColor.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductColor = sequelize.define('ProductColor', {
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
        color_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'Colors',
                key: 'id',
            },
        },
    }, {
        tableName: 'product_colors',
        timestamps: false,
    });

    return ProductColor;
};
