const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Payment', {
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
        payment_method: {
            type: DataTypes.ENUM('credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'),
            allowNull: false
        },
        payment_status: {
            type: DataTypes.ENUM('pending', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        payment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        transaction_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
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
        tableName: 'payments',
        timestamps: false
    });
};
