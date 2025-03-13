const couponService = require('../services/couponService');

const couponController = {
    createCoupon: async (req, res) => {
        try {
            const coupon = await couponService.createCoupon(req.body);
            res.status(201).json({
                code: 201,
                success: true,
                data: coupon
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    },

    getAllCoupons: async (req, res) => {
        try {
            const filters = {
                page: req.query.page || 1,
                limit: req.query.limit || 10,
                search: req.query.search,
                is_active: req.query.is_active,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                minAmount: req.query.minAmount,
                maxAmount: req.query.maxAmount,
                sortBy: req.query.sortBy || 'created_at',
                sortOrder: req.query.sortOrder || 'DESC',
                minOrderAmount: req.query.minOrderAmount,
            };

            const result = await couponService.getAllCoupons(filters);
            res.json({
                code: 200,
                success: true,
                data: {
                    coupons: result.rows,
                    total: result.count,
                    page: parseInt(filters.page),
                    limit: parseInt(filters.limit),
                    filters: {
                        search: filters.search,
                        is_active: filters.is_active,
                        startDate: filters.startDate,
                        endDate: filters.endDate,
                        minAmount: filters.minAmount,
                        maxAmount: filters.maxAmount,
                        sortBy: filters.sortBy,
                        sortOrder: filters.sortOrder
                    }
                }
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    },

    getCouponById: async (req, res) => {
        try {
            const coupon = await couponService.getCouponById(req.params.id);
            if (!coupon) {
                return res.status(404).json({
                    code: 404,
                    success: false,
                    message: 'Không tìm thấy mã giảm giá'
                });
            }
            res.json({
                code: 200,
                success: true,
                data: coupon
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    },

    validateCoupon: async (req, res) => {
        try {
            const { code } = req.body;
            const { orderAmount } = req.body;
            if (!code) {
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: 'Vui lòng nhập mã giảm giá'
                });
            }

            const result = await couponService.validateCoupon(code, parseFloat(orderAmount));
            res.json({
                code: 200,
                success: true,
                data: {
                    orderAmount: parseFloat(orderAmount),
                    ...result,
                    validation_time: new Date()
                }
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    },

    applyCoupon: async (req, res) => {
        try {
            const { code } = req.body;
            const { orderAmount } = req.body;
            if (!code) {
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: 'Vui lòng nhập mã giảm giá'
                });
            }

            const result = await couponService.applyCoupon(code, parseFloat(orderAmount));
            res.json({
                code: 200,
                success: true,
                data: {
                    ...result,
                    applied_at: new Date(),
                    message: 'Áp dụng mã giảm giá thành công'
                }
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    },

    updateCoupon: async (req, res) => {
        try {
            const coupon = await couponService.updateCoupon(req.params.id, req.body);
            res.json({
                code: 200,
                success: true,
                data: coupon
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    },

    deleteCoupon: async (req, res) => {
        try {
            await couponService.deleteCoupon(req.params.id);
            res.json({
                code: 200,
                success: true,
                message: 'Xóa mã giảm giá thành công'
            });
        } catch (error) {
            res.status(400).json({
                code: 400,
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = couponController;

