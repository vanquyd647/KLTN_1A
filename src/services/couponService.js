const { Coupon, sequelize } = require('../models'); // Thêm sequelize vào đây
const { Op } = require('sequelize');

const couponService = {
    createCoupon: async (couponData) => {
        try {
            return await Coupon.create(couponData);
        } catch (error) {
            throw error;
        }
    },

    getAllCoupons: async (filters = {}) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search,
                is_active,
                startDate,
                endDate,
                minAmount,
                maxAmount,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = filters;

            const offset = (page - 1) * limit;
            const where = {};

            // Filter theo trạng thái active
            if (typeof is_active !== 'undefined' && is_active !== '') {
                where.is_active = is_active === 'true';
            }

            // Filter theo search (code hoặc description)
            if (search) {
                where[Op.or] = [
                    { code: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ];
            }

            // Filter theo khoảng thời gian
            if (startDate || endDate) {
                where.expiry_date = {};
                if (startDate) {
                    where.expiry_date[Op.gte] = new Date(startDate);
                }
                if (endDate) {
                    where.expiry_date[Op.lte] = new Date(endDate);
                }
            }

            // Filter theo khoảng giá giảm
            if (minAmount || maxAmount) {
                where.discount_amount = {};
                if (minAmount) {
                    where.discount_amount[Op.gte] = minAmount;
                }
                if (maxAmount) {
                    where.discount_amount[Op.lte] = maxAmount;
                }
            }

            // Validate sortBy để tránh SQL injection
            const validSortColumns = ['created_at', 'expiry_date', 'discount_amount', 'code'];
            const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
            
            // Validate sortOrder
            const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) 
                ? sortOrder.toUpperCase() 
                : 'DESC';

            return await Coupon.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [[finalSortBy, finalSortOrder]],
                attributes: [
                    'id', 'code', 'description', 'discount_amount',
                    'expiry_date', 'total_quantity', 'used_quantity',
                    'is_active', 'created_at', 'updated_at'
                ]
            });
        } catch (error) {
            throw error;
        }
    },

    getCouponById: async (id) => {
        try {
            return await Coupon.findByPk(id);
        } catch (error) {
            throw error;
        }
    },

    validateCoupon: async (code) => {
        try {
            // Thêm logging để debug
            console.log('Validating coupon with code:', code);

            const coupon = await Coupon.findOne({
                where: {
                    code: code,
                    is_active: true,
                    expiry_date: {
                        [Op.gt]: new Date()
                    }
                }
            });

            // Log kết quả tìm kiếm
            console.log('Found coupon:', coupon);

            if (!coupon) {
                throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
            }

            // Kiểm tra số lượng riêng
            if (coupon.total_quantity > 0 && coupon.used_quantity >= coupon.total_quantity) {
                throw new Error('Mã giảm giá đã hết lượt sử dụng');
            }

            const remainingQuantity = coupon.total_quantity === 0 ?
                'Không giới hạn' :
                (coupon.total_quantity - coupon.used_quantity);

            const daysUntilExpiry = Math.ceil(
                (new Date(coupon.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
            );

            return {
                couponInfo: {
                    id: coupon.id,
                    code: coupon.code,
                    description: coupon.description,
                    discount_amount: coupon.discount_amount,
                    expiry_date: coupon.expiry_date,
                    remaining_quantity: remainingQuantity,
                    days_until_expiry: daysUntilExpiry,
                    is_active: coupon.is_active
                },
                status: 'valid',
                message: 'Mã giảm giá hợp lệ'
            };
        } catch (error) {
            throw error;
        }
    },

    // couponService.js
    applyCoupon: async (code) => {
        try {
            // Validate coupon trước
            const validationResult = await couponService.validateCoupon(code);
            if (!validationResult) {
                throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
            }

            // Nếu validate thành công, tìm và cập nhật coupon
            const coupon = await Coupon.findOne({ where: { code } });

            if (coupon.total_quantity > 0) {
                if (coupon.used_quantity >= coupon.total_quantity) {
                    throw new Error('Mã giảm giá đã hết lượt sử dụng');
                }
                await coupon.increment('used_quantity', { by: 1 });
                await coupon.reload(); // Reload để lấy dữ liệu mới nhất
            }

            // Trả về thông tin coupon đã được cập nhật
            return {
                couponInfo: {
                    id: coupon.id,
                    code: coupon.code,
                    description: coupon.description,
                    discount_amount: coupon.discount_amount,
                    expiry_date: coupon.expiry_date,
                    remaining_quantity: coupon.total_quantity === 0 ?
                        'Không giới hạn' :
                        (coupon.total_quantity - coupon.used_quantity),
                    days_until_expiry: Math.ceil(
                        (new Date(coupon.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                    ),
                    is_active: coupon.is_active
                },
                status: 'applied',
                message: 'Áp dụng mã giảm giá thành công'
            };
        } catch (error) {
            throw error;
        }
    },


    updateCoupon: async (id, updateData) => {
        try {
            const coupon = await Coupon.findByPk(id);
            if (!coupon) throw new Error('Không tìm thấy mã giảm giá');
            return await coupon.update(updateData);
        } catch (error) {
            throw error;
        }
    },

    deleteCoupon: async (id) => {
        try {
            const coupon = await Coupon.findByPk(id);
            if (!coupon) throw new Error('Không tìm thấy mã giảm giá');
            await coupon.destroy();
            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = couponService;
