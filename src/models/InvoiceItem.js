const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('InvoiceItem', {
        id: {
            type: DataTypes.BIGINT,  // Sửa từ INTEGER thành BIGINT để khớp với Invoice
            primaryKey: true,
            autoIncrement: true
        },
        invoice_id: {
            type: DataTypes.BIGINT,  // Sửa từ INTEGER thành BIGINT để khớp với Invoice.id
            allowNull: false,
            references: {
                model: 'invoices',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.BIGINT,  // Sửa từ INTEGER thành BIGINT để khớp với Product.id
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        size_id: {
            type: DataTypes.BIGINT,  // Sửa từ INTEGER thành BIGINT
            allowNull: true,
            references: {
                model: 'sizes',
                key: 'id'
            }
        },
        color_id: {
            type: DataTypes.BIGINT,  // Sửa từ INTEGER thành BIGINT
            allowNull: true,
            references: {
                model: 'colors',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'invoice_items',
        underscored: true,
        timestamps: true
    });
};
