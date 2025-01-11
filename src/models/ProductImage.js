// models/ProductImage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProductImage = sequelize.define('ProductImage', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        color_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'colors',
                key: 'id',
            },
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'product_images',
        timestamps: false,
    });

    return ProductImage;
};
