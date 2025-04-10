const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

/**
 * @route GET /api/categories
 * @desc Lấy tất cả danh mục
 * @access Public
 */
router.get('/',  categoryController.getAllCategories);

/**
 * @route GET /api/categories/:id
 * @desc Lấy danh mục theo ID
 * @access Public
 */
router.get('/:id',  categoryController.getCategoryById);

/**
 * @route POST /api/categories
 * @desc Tạo danh mục mới
 * @access Private (Admin)
 */
router.post('/', adminAuthMiddleware, categoryController.createCategory);

/**
 * @route PUT /api/categories/:id
 * @desc Cập nhật danh mục
 * @access Private (Admin)
 */
router.put('/:id', adminAuthMiddleware, categoryController.updateCategory);

/**
 * @route DELETE /api/categories/:id
 * @desc Xóa danh mục
 * @access Private (Admin)
 */
router.delete('/:id', adminAuthMiddleware, categoryController.deleteCategory);

module.exports = router;
