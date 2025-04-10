"use strict";

const categoryService = require('../services/categoryService');

const categoryController = {
    /**
     * Tạo danh mục mới
     */
    async createCategory(req, res) {
        try {
            const categoryData = req.body;
            
            if (!categoryData.name) {
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: 'Tên danh mục là bắt buộc'
                });
            }
            
            const category = await categoryService.createCategory(categoryData);
            
            return res.status(201).json({
                code: 201,
                success: true,
                message: 'Tạo danh mục thành công',
                data: category
            });
        } catch (error) {
            return res.status(500).json({
                code: 500,
                success: false,
                message: 'Lỗi khi tạo danh mục',
                error: error.message
            });
        }
    },
    
    /**
     * Lấy tất cả danh mục
     */
    async getAllCategories(req, res) {
        try {
            const categories = await categoryService.getAllCategories();
            
            return res.status(200).json({
                code: 200,
                success: true,
                data: categories
            });
        } catch (error) {
            return res.status(500).json({
                code: 500,
                success: false,
                message: 'Lỗi khi lấy danh sách danh mục',
                error: error.message
            });
        }
    },
    
    /**
     * Lấy danh mục theo ID
     */
    async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            
            const category = await categoryService.getCategoryById(id);
            
            return res.status(200).json({
                code: 200,
                success: true,
                data: category
            });
        } catch (error) {
            return res.status(error.message === 'Danh mục không tồn tại' ? 404 : 500).json({
                code: error.message === 'Danh mục không tồn tại' ? 404 : 500,
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Cập nhật danh mục
     */
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const categoryData = req.body;
            
            const updatedCategory = await categoryService.updateCategory(id, categoryData);
            
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Cập nhật danh mục thành công',
                data: updatedCategory
            });
        } catch (error) {
            return res.status(error.message === 'Danh mục không tồn tại' ? 404 : 500).json({
                code: error.message === 'Danh mục không tồn tại' ? 404 : 500,
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Xóa danh mục
     */
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            
            await categoryService.deleteCategory(id);
            
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Xóa danh mục thành công'
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Danh mục không tồn tại') {
                statusCode = 404;
            } else if (error.message === 'Không thể xóa danh mục đang chứa sản phẩm') {
                statusCode = 400;
            }
            
            return res.status(statusCode).json({
                code: statusCode,
                success: false,
                message: error.message
            });
        }
    },
};

module.exports = categoryController;
