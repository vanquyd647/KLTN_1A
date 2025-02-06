const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderDetail', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            },
            onDelete: 'CASCADE',
            comment: 'ID của đơn hàng liên kết'
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'ID của người dùng nếu đăng nhập'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tên khách hàng hoặc người dùng'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Email khách hàng hoặc người dùng'
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Số điện thoại khách hàng hoặc người dùng'
        },
        street: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Địa chỉ đường'
        },
        ward: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Phường/Xã'
        },
        district: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Quận/Huyện'
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Thành phố'
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Quốc gia'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW
        }
    }, {
        tableName: 'order_details',
        timestamps: false
    });
};
