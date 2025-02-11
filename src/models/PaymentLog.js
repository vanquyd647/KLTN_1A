const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('PaymentLog', {
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
            }
        },      
        status: {
            type: DataTypes.ENUM('initiated', 'success', 'failure', 'cancelled', 'pending'),
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'payment_logs',
        timestamps: false
    });
};
