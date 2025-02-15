"use strict";

const { Op } = require('sequelize');
const { Product } = require('../models'); // Đường dẫn tới models

async function updateIsNewStatus() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
        const result = await Product.update(
            { is_new: false }, // Giá trị cần cập nhật
            {
                where: {
                    is_new: true,
                    created_at: {
                        [Op.lte]: oneWeekAgo, // Kiểm tra tạo trước 1 tuần
                    },
                },
            }
        );
        console.log(`Updated ${result[0]} products to is_new = false.`);
    } catch (error) {
        console.error('Error updating is_new status:', error);
    }
}

// Export để dùng trong nơi khác
module.exports = { updateIsNewStatus };

// Gọi hàm nếu chạy trực tiếp
if (require.main === module) {
    updateIsNewStatus();
}
