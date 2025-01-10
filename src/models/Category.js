"use strict";
// models/Category.js
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: 'categories',
        timestamps: true,
    });

    return Category;
};

