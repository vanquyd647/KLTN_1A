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
        coupon_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'coupons',
                key: 'id'
            },
            comment: 'ID của mã giảm giá nếu có'
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Phí vận chuyển'
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Giá giảm giá nếu có'
        },
        original_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Giá gốc trước khi áp dụng giảm giá'
        },
        final_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Giá cuối cùng phải thanh toán'
        },
        status: {
            type: DataTypes.ENUM(
                'pending',         // Chờ xử lý
                'completed',       // Hoàn thành
                'cancelled',       // Đã hủy
                'failed',         // Thất bại
                'in_payment',     // Đang thanh toán
                'in_progress',    // Đang xử lý
                'shipping'        // Đang vận chuyển
            ),
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
