// models/UserRole.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/connect_db');
const User = require('./User');
const Role = require('./Role');

module.exports = (sequelize) => {
    const UserRole = sequelize.define('UserRole', {
        user_id: {
            type: DataTypes.BIGINT,
            primaryKey: true, // Đặt user_id là một phần của primary key
            references: {
                model: 'users',
                key: 'id',
            },
        },
        role_id: {
            type: DataTypes.BIGINT,
            primaryKey: true, // Đặt role_id là một phần của primary key
            references: {
                model: 'roles',
                key: 'id',
            },
        },
    }, {
        tableName: 'user_roles',
        timestamps: false,
    });

    return UserRole;
};
