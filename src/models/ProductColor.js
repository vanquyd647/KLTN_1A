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
                model: 'products',
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
        image: {
            type: DataTypes.TEXT, // hoặc DataTypes.TEXT nếu bạn muốn lưu trữ URL dài hơn
            allowNull: true, // Có thể null nếu không có hình ảnh
        },
    }, {
        tableName: 'product_colors',
        timestamps: false,
    });

    return ProductColor;
};
