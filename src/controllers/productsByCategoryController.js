"use strict";

const productByCategoryService = require('../services/productsByCategoryService');

const getProductsByCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, sort, priceRange, colorIds } = req.query;

    try {
        const result = await productByCategoryService.getProductsByCategory(
            categoryId,
            parseInt(page, 10),
            parseInt(limit, 10),
            sort,
            priceRange,
            colorIds ? colorIds.split(',').map(Number) : []
        );

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách sản phẩm thành công',
            data: result,
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi máy chủ, không thể lấy danh sách sản phẩm',
            error: error.message,
        });
    }
};

module.exports = { getProductsByCategory };
