"use strict";

const { Category, ProductCategory, Product } = require('../models');
const { sequelize } = require('../models');
const logger = require('../configs/winston');
const { Op } = require('sequelize');

const categoryService = {

    /**
     * Tạo danh mục mới
     * @param {Object} categoryData - Dữ liệu danh mục
     * @returns {Object} - Danh mục đã tạo
     */
    async createCategory(categoryData) {
        try {
            const category = await Category.create({
                name: categoryData.name,
                description: categoryData.description || ''
            });
            
            return category;
        } catch (error) {
            logger.error(`Lỗi khi tạo danh mục: ${error.message}`);
            throw error;
        }
    },

    /**
     * Lấy tất cả danh mục
     * @returns {Array} - Danh sách danh mục
     */
    async getAllCategories() {
        try {
            return await Category.findAll({
                order: [['name', 'ASC']]
            });
        } catch (error) {
            logger.error(`Lỗi khi lấy danh sách danh mục: ${error.message}`);
            throw error;
        }
    },

    /**
     * Lấy danh mục theo ID
     * @param {number} id - ID danh mục
     * @returns {Object} - Thông tin danh mục
     */
    async getCategoryById(id) {
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new Error('Danh mục không tồn tại');
            }
            return category;
        } catch (error) {
            logger.error(`Lỗi khi lấy danh mục theo ID: ${error.message}`);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin danh mục
     * @param {number} id - ID danh mục
     * @param {Object} categoryData - Dữ liệu cập nhật
     * @returns {Object} - Danh mục đã cập nhật
     */
    async updateCategory(id, categoryData) {
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new Error('Danh mục không tồn tại');
            }

            // Cập nhật thông tin
            if (categoryData.name) category.name = categoryData.name;
            if (categoryData.description) {
                category.description = categoryData.description;
            } else if (categoryData.name) {
                // Nếu tên thay đổi và không cung cấp slug mới, tạo lại slug
                category.description = this.generateSlug(category.name, category.id);
            }

            await category.save();
            return category;
        } catch (error) {
            logger.error(`Lỗi khi cập nhật danh mục: ${error.message}`);
            throw error;
        }
    },

    /**
     * Xóa danh mục
     * @param {number} id - ID danh mục cần xóa
     * @returns {boolean} - Kết quả xóa
     */
    async deleteCategory(id) {
        const t = await sequelize.transaction();
        
        try {
            const category = await Category.findByPk(id);
            if (!category) {
                throw new Error('Danh mục không tồn tại');
            }

            // Kiểm tra xem danh mục có chứa sản phẩm không
            const productCount = await ProductCategory.count({
                where: { category_id: id }
            });

            if (productCount > 0) {
                throw new Error('Không thể xóa danh mục đang chứa sản phẩm');
            }

            // Thực hiện xóa
            await category.destroy({ transaction: t });
            await t.commit();
            
            return true;
        } catch (error) {
            await t.rollback();
            logger.error(`Lỗi khi xóa danh mục: ${error.message}`);
            throw error;
        }
    },
};

module.exports = categoryService;
