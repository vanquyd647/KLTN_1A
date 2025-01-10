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
                model: 'Orders', // Tên bảng Order
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'Products', // Tên bảng Product
                key: 'id'
            }
        },
        size_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'Sizes', // Tên bảng Size
                key: 'id'
            }
        },
        color_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'Colors', // Tên bảng Color
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
        }
    }, {
        tableName: 'order_items',
        timestamps: false
    });
};
