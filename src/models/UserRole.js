// models/UserRole.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/connect_db');
const User = require('./User');
const Role = require('./Role');

module.exports = (sequelize) => {
    const UserRole = sequelize.define('UserRole', {
        user_id: {
            type: DataTypes.BIGINT,
            references: {
                model: User,
                key: 'id',
            },
        },
        role_id: {
            type: DataTypes.BIGINT,
            references: {
                model: Role,
                key: 'id',
            },
        },
    }, {
        tableName: 'user_roles',
        timestamps: false,
    });

    return UserRole;
};
