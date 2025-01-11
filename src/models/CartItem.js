const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('CartItem', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        cart_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'carts', // Tên bảng Cart
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'products', // Tên bảng Product
                key: 'id'
            }
        },
        size_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'sizes', // Tên bảng Size
                key: 'id'
            }
        },
        color_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'colors', // Tên bảng Color
                key: 'id'
            }
        },
        reserved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false, // Mặc định không giữ chỗ
            allowNull: false,
        },
        reserved_until: {
            type: DataTypes.DATE,
            allowNull: true, // Thời gian hết hạn giữ chỗ
        },
        status: {
            type: DataTypes.ENUM('pending', 'purchased', 'failed'),
            defaultValue: 'pending', // Trạng thái mặc định
            allowNull: false,
        },
    }, {
        tableName: 'cart_items',
        timestamps: false
    });
};
