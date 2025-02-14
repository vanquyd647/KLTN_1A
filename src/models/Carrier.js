// models/Carrier.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Carrier = sequelize.define('Carrier', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Tên của nhà vận chuyển',
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Mô tả về nhà vận chuyển',
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Email liên hệ của nhà vận chuyển',
        },
        contact_phone: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Số điện thoại liên hệ',
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Website của nhà vận chuyển',
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Giá vận chuyển',
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Trạng thái hoạt động của nhà vận chuyển',
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'carriers',
        timestamps: false,
    });

    return Carrier;
};
