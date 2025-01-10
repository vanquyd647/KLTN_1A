// models/Size.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Size = sequelize.define('Size', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        size: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'sizes',
        timestamps: false,
    });

    return Size;
};
