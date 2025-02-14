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
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'ID của người dùng nếu đăng nhập'
        },
        carrier_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'carriers',
                key: 'id',
            },
            comment: 'ID của nhà vận chuyển'
        },
        discount_code: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Mã giảm giá nếu có'
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            comment: 'Số tiền giảm giá áp dụng'
        },
        original_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Giá gốc trước khi áp dụng giảm giá'
        },
        discounted_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Giá sau khi áp dụng giảm giá'
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Giá cuối cùng phải thanh toán'
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'canceled', 'failed', 'in_payment', 'in_progress'),
            allowNull: false,
            defaultValue: 'pending'
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true, 
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW
        }
    }, {
        tableName: 'orders',
        timestamps: false
    });
};
