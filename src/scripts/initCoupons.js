"use strict";

const { Coupon } = require('../models');
const logger = require('../configs/winston');

const coupons = [
    {
        id: 1,
        code: "SALE50",
        description: "giảm 50,000 đơn từ 250,000",
        discount_amount: 50000.00,
        min_order_amount: 250000.00,
        expiry_date: "2026-01-01 07:00:00",
        total_quantity: 0,
        used_quantity: 0,
        is_active: true,
        created_at: "2025-03-12 20:06:02",
        updated_at: "2025-03-13 16:35:04"
    },
    {
        id: 2,
        code: "SALE20",
        description: "giảm 20000 đơn từ 100,000", 
        discount_amount: 20000.00,
        min_order_amount: 100000.00,
        expiry_date: "2026-01-01 07:00:00",
        total_quantity: 0,
        used_quantity: 0,
        is_active: true,
        created_at: "2025-03-13 16:35:34",
        updated_at: "2025-03-13 16:35:34"
    },
    {
        id: 3,
        code: "SALE5",
        description: "giảm 5000 đơn từ 50,000",
        discount_amount: 5000.00,
        min_order_amount: 50000.00,
        expiry_date: "2025-12-31 07:00:00",
        total_quantity: 0,
        used_quantity: 0,
        is_active: true,
        created_at: "2025-03-13 16:36:27",
        updated_at: "2025-03-13 16:36:27"
    }
];

const initCoupons = async () => {
    try {
        // Kiểm tra xem đã có dữ liệu chưa
        const existingCoupons = await Coupon.count();
        
        if (existingCoupons > 0) {
            logger.info('Coupons data already exists, skipping initialization');
            return;
        }

        // Thêm dữ liệu mới
        await Coupon.bulkCreate(coupons);
        
        logger.info('✅ Coupons initialized successfully');
    } catch (error) {
        logger.error('❌ Error initializing coupons:', error);
        throw error;
    }
};

module.exports = initCoupons;
