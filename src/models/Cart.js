const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Cart', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'users',  // Tham chiếu đến bảng User
                key: 'id',
            },
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },{
        tableName: 'carts',
        timestamps: false,
    });
};
