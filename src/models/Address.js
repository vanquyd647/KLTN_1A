// models/Address.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Address = sequelize.define('Address', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'users', 
                key: 'id',
            },
        },
        street: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ward: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        district: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
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
        tableName: 'addresses',
        timestamps: false,
    });

    return Address;
};
