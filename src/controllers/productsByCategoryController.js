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

const updateProductCategories = async (req, res) => {
    const { productId } = req.params;
    const { categoryIds } = req.body;

    try {
        // Validate input
        if (!Array.isArray(categoryIds)) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'categoryIds phải là một mảng',
            });
        }

        if (categoryIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                code: 400,
                message: 'Phải có ít nhất một danh mục',
            });
        }

        const updatedProduct = await productByCategoryService.updateProductCategories(
            parseInt(productId, 10),
            categoryIds
        );

        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Cập nhật danh mục sản phẩm thành công',
            data: updatedProduct,
        });

    } catch (error) {
        console.error('Error updating product categories:', error);
        
        if (error.message === 'Product not found') {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        if (error.message === 'One or more categories not found') {
            return res.status(404).json({
                status: 'error',
                code: 404,
                message: 'Một hoặc nhiều danh mục không tồn tại',
            });
        }

        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi máy chủ khi cập nhật danh mục sản phẩm',
            error: error.message,
        });
    }
};

module.exports = { getProductsByCategory, updateProductCategories };
