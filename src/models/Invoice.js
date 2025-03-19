const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Invoice', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            },
            comment: 'ID của đơn hàng liên kết'
        },
        invoice_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Mã hóa đơn duy nhất'
        },
        creator_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'ID của người tạo hóa đơn (admin/nhân viên)'
        },
        buyer_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'ID của người mua hàng (nếu có tài khoản)'
        },
        buyer_name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tên người mua'
        },
        buyer_address: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Địa chỉ đầy đủ của người mua'
        },
        buyer_email: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Email của người mua'
        },
        buyer_phone: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Số điện thoại của người mua'
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
        payment_method: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Phương thức thanh toán'
        },
        payment_status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'completed',
            comment: 'Trạng thái thanh toán'
        },
        issue_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Ngày phát hành hóa đơn'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Ghi chú cho hóa đơn'
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
        tableName: 'invoices',
        timestamps: false
    });
};
