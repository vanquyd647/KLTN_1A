const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Order', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'users', // Tên bảng User
                key: 'id'
            }
        },
        address_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'addresses', // Bảng Address
                key: 'id'
            }
        },
        discount_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'canceled', 'failed', 'in_payment'),
            allowNull: false,
            defaultValue: 'pending'
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true, // Thời gian hết hạn khi đơn hàng ở trạng thái `in_payment`
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'orders',
        timestamps: false
    });
};
