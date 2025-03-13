const { Coupon, sequelize } = require('../models'); // Thêm sequelize vào đây
const { Op } = require('sequelize');
const redisClient = require('../configs/redisClient');

const couponService = {
    createCoupon: async (couponData) => {
        try {
            if (couponData.min_order_amount < 0) {
                throw new Error('Giá trị đơn hàng tối thiểu không thể âm');
            }
            return await Coupon.create({
                ...couponData,
                min_order_amount: couponData.min_order_amount || 0 // Mặc định là 0 nếu không có
            });
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
                sortOrder = 'DESC',
                min_order_amount
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

            if (min_order_amount || min_order_amount) {
                where.min_order_amount = {};
                if (min_order_amount) {
                    where.min_order_amount[Op.gte] = min_order_amount;
                }
                if (maxOrderAmount) {
                    where.min_order_amount[Op.lte] = maxOrderAmount;
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
                    'id', 'code', 'description', 'discount_amount', 'min_order_amount',
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

    validateCoupon: async (code, orderAmount) => {
        try {
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

            console.log('Found coupon:', coupon);

            if (!coupon) {
                throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
            }

            // Kiểm tra điều kiện đơn hàng tối thiểu
            if (orderAmount && orderAmount < coupon.min_order_amount) {
                throw new Error(`Đơn hàng tối thiểu ${coupon.min_order_amount.toLocaleString()}đ để sử dụng mã này`);
            }

            // Kiểm tra số lượng
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
                    min_order_amount: coupon.min_order_amount,
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
    applyCoupon: async (code, orderAmount) => {
        try {
            // Validate coupon với orderAmount
            const validationResult = await couponService.validateCoupon(code, orderAmount);
            if (!validationResult) {
                throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
            }

            const coupon = await Coupon.findOne({ where: { code } });

            // Kiểm tra điều kiện đơn hàng tối thiểu
            if (orderAmount < coupon.min_order_amount) {
                throw new Error(`Đơn hàng tối thiểu ${coupon.min_order_amount.toLocaleString()}đ để sử dụng mã này`);
            }

            if (coupon.total_quantity > 0) {
                if (coupon.used_quantity >= coupon.total_quantity) {
                    throw new Error('Mã giảm giá đã hết lượt sử dụng');
                }
                await coupon.increment('used_quantity', { by: 1 });
                await coupon.reload();
            }

            return {
                couponInfo: {
                    id: coupon.id,
                    code: coupon.code,
                    description: coupon.description,
                    discount_amount: coupon.discount_amount,
                    min_order_amount: coupon.min_order_amount,
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
            // Validate min_order_amount khi cập nhật
            if (updateData.min_order_amount !== undefined && updateData.min_order_amount < 0) {
                throw new Error('Giá trị đơn hàng tối thiểu không thể âm');
            }
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
    },

    setCouponsCache: async (coupons) => {
        try {
            await redisClient.setex(
                CACHE_KEY,
                CACHE_TTL,
                JSON.stringify(coupons)
            );
        } catch (error) {
            console.error('Redis cache error:', error);
        }
    },

    // Thêm hàm lấy cache
    getCouponsFromCache: async () => {
        try {
            const cachedData = await redisClient.get(CACHE_KEY);
            return cachedData ? JSON.parse(cachedData) : null;
        } catch (error) {
            console.error('Redis cache error:', error);
            return null;
        }
    },
};

module.exports = couponService;
