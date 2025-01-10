"use strict";
// models/Token.js
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Token = sequelize.define('Token', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        refresh_token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        tableName: 'tokens',
        timestamps: false,
    });

    return Token;
};
