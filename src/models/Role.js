// models/Role.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        role_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'roles',
        timestamps: false,
    });

    return Role;
};
