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
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'purchased', 'failed'),
            defaultValue: 'pending', // Trạng thái mặc định
            allowNull: false,
        },
        is_selected: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },    
    }, {
        tableName: 'cart_items',
        timestamps: false
    });
};
