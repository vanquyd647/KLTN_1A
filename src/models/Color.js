// models/Color.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Color = sequelize.define('Color', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        hex_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'colors',
        timestamps: false,
    });

    return Color;
};
