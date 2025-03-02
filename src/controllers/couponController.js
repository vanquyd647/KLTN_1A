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
            const result = await couponService.getAllCoupons(req.query);
            res.json({
                code: 200,
                success: true,
                data: {
                    coupons: result.rows,
                    total: result.count,
                    page: parseInt(req.query.page || 1),
                    limit: parseInt(req.query.limit || 10)
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
            if (!code) {
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: 'Vui lòng nhập mã giảm giá'
                });
            }

            const result = await couponService.validateCoupon(code);
            res.json({
                code: 200,
                success: true,
                data: {
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
            if (!code) {
                return res.status(400).json({
                    code: 400,
                    success: false,
                    message: 'Vui lòng nhập mã giảm giá'
                });
            }

            const result = await couponService.applyCoupon(code);
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

