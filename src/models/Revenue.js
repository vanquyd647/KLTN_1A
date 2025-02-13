// models/Revenue.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Revenue', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {  // Đổi tên từ orderId thành order_id
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'orders',  // Đổi từ Orders thành orders
                key: 'id'
            }
        },
        payment_id: {  // Đổi tên từ paymentId thành payment_id
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'payments',  // Đổi từ Payments thành payments
                key: 'id'
            }
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        created_at: {  // Đổi tên từ createdAt thành created_at
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {  // Đổi tên từ updatedAt thành updated_at
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'revenues',  // Đổi thành chữ thường
        timestamps: false  // Đổi thành false vì ta tự quản lý timestamps
    });
};
