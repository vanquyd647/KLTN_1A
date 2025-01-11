const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderItem', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'orders', // Tên bảng Order
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
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
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
    }, {
        tableName: 'order_items',
        timestamps: false
    });
};
