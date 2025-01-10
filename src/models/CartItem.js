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
                model: 'Carts', // Tên bảng Cart
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
        }
    }, {
        tableName: 'cart_items',
        timestamps: false
    });
};
