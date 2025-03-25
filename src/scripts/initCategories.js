// scripts/initCategories.js
const { Category, ProductCategory } = require('../models');
const logger = require('../configs/winston');

const categories = [
    {
        id: 1,
        name: "Áo",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 2,
        name: "Áo Thun",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 3,
        name: "Nam",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 4,
        name: "Áo Thun Nam",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 5,
        name: "Nữ",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 6,
        name: "Áo Thun Nữ",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 7,
        name: "Thời Trang",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 8,
        name: "Thời Trang Nam",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 9,
        name: "Thời Trang Nữ",
        description: "",
        createdAt: "2025-03-24 21:43:36",
        updatedAt: "2025-03-24 21:43:36"
    },
    {
        id: 10,
        name: "Áo Polo",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 11,
        name: "Áo Polo Nam",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 12,
        name: "Áo Polo Nữ",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 13,
        name: "Áo Sơ Mi",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 14,
        name: "Áo Sơ Mi Nam",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 15,
        name: "Quần",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 16,
        name: "Quần Âu",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 17,
        name: "Quần Âu Nam",
        description: "",
        createdAt: "2025-03-24 21:43:37",
        updatedAt: "2025-03-24 21:43:37"
    },
    {
        id: 18,
        name: "Quần Jeans",
        description: "",
        createdAt: "2025-03-24 21:43:38",
        updatedAt: "2025-03-24 21:43:38"
    },
    {
        id: 19,
        name: "Quần Jeans Nam",
        description: "",
        createdAt: "2025-03-24 21:43:38",
        updatedAt: "2025-03-24 21:43:38"
    },
    {
        id: 20,
        name: "Quần Short",
        description: "",
        createdAt: "2025-03-24 21:43:38",
        updatedAt: "2025-03-24 21:43:38"
    },
    {
        id: 21,
        name: "Quần Short Nam",
        description: "",
        createdAt: "2025-03-24 21:43:38",
        updatedAt: "2025-03-24 21:43:38"
    },
    {
        id: 22,
        name: "Quần Kaki",
        description: "",
        createdAt: "2025-03-24 21:43:38",
        updatedAt: "2025-03-24 21:43:38"
    },
    {
        id: 23,
        name: "Quần Kaki Nam",
        description: "",
        createdAt: "2025-03-24 21:43:38",
        updatedAt: "2025-03-24 21:43:38"
    },
    {
        id: 24,
        name: "Áo Khoác",
        description: "",
        createdAt: "2025-03-25 16:07:34",
        updatedAt: "2025-03-25 16:07:34"
    },
    {
        id: 25,
        name: "Áo Khoác Nữ",
        description: "",
        createdAt: "2025-03-25 16:07:34",
        updatedAt: "2025-03-25 16:07:34"
    },
    {
        id: 26,
        name: "Áo Sơ Mi Nữ",
        description: "",
        createdAt: "2025-03-25 16:27:44",
        updatedAt: "2025-03-25 16:27:44"
    },
    {
        id: 27,
        name: "Quần Jeans Nữ",
        description: "",
        createdAt: "2025-03-25 16:32:35",
        updatedAt: "2025-03-25 16:32:35"
    },
    {
        id: 28,
        name: "Quần Tây",
        description: "",
        createdAt: "2025-03-25 16:39:28",
        updatedAt: "2025-03-25 16:39:28"
    },
    {
        id: 29,
        name: "Quần Tây Nữ",
        description: "",
        createdAt: "2025-03-25 16:39:28",
        updatedAt: "2025-03-25 16:39:28"
    },
    {
        id: 30,
        name: "Quần Nữ",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 31,
        name: "Quần Short Nữ",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 32,
        name: "Áo Nữ",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 33,
        name: "Áo Nam",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 34,
        name: "Áo Khoác Nam",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 35,
        name: "Mũ",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 36,
        name: "Thắt Lưng",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 37,
        name: "Ví",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    },
    {
        id: 38,
        name: "Phụ Kiện",
        description: "",
        createdAt: "2025-03-25 16:45:55",
        updatedAt: "2025-03-25 16:45:55"
    }
];

/**
 * Initializes the categories table with predefined data
 * @async
 * @function initCategories
 * @returns {Promise<void>}
 * @throws {Error} If initialization fails
 */
const initCategories = async () => {
    try {
        // Xóa dữ liệu từ bảng product_categories trước
        await ProductCategory.destroy({
            where: {},
            force: true
        });

        // Sau đó mới xóa dữ liệu từ bảng categories
        await Category.destroy({
            where: {},
            force: true
        });

        // Thêm categories mới
        await Category.bulkCreate(categories, {
            validate: true,
            returning: true
        });

        logger.info('✅ Categories initialized successfully');
        console.log('✅ Categories initialized successfully');
    } catch (error) {
        logger.error('❌ Error initializing categories:', error);
        console.error('❌ Error initializing categories:', error);
        throw error;
    }
};

module.exports = initCategories;
