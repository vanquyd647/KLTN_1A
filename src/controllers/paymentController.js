const PaymentService = require("../services/paymentService");

class PaymentController {
    // Xử lý tạo thanh toán PayOS
    async createPayOSPayment(req, res) {
        const { order_id, amount, email } = req.body;

        if (!order_id || !amount || !email) {
            return res.status(400).json({
                code: "01",
                status: "BAD_REQUEST",
                message: "Thiếu thông tin bắt buộc",
                data: null
            });
        }

        try {
            const checkoutUrl = await PaymentService.createPayOSPayment(order_id, amount, email);
            return res.status(200).json({
                code: "00",
                status: "SUCCESS",
                message: "Tạo thanh toán PayOS thành công",
                checkoutUrl
            });
        } catch (error) {
            console.error("❌ Lỗi tạo thanh toán với PayOS:", error);
            return res.status(500).json({
                code: "99",
                status: "ERROR",
                message: "Lỗi tạo thanh toán với PayOS",
                data: null
            });
        }
    }

    // Xử lý webhook PayOS
    async handlePayOSWebhook(req, res) {
        try {
            await PaymentService.processPayOSWebhook(req.body);
            return res.status(200).json({
                code: "00",
                status: "SUCCESS",
                message: "Webhook xử lý thành công",
                data: null
            });
        } catch (error) {
            console.error("❌ Lỗi xử lý webhook PayOS:", error);
            return res.status(500).json({
                code: "99",
                status: "ERROR",
                message: "Lỗi xử lý webhook PayOS",
                data: null
            });
        }
    }

    // Xử lý tạo thanh toán COD
    async createCODPayment(req, res) {
        const { order_id, amount, email } = req.body;

        if (!order_id || !amount || !email) {
            return res.status(400).json({
                code: "01",
                status: "BAD_REQUEST",
                message: "Thiếu thông tin bắt buộc",
                data: null
            });
        }

        try {
            const result = await PaymentService.createCODPayment(order_id, amount, email);
            return res.status(200).json({
                code: "00",
                status: "SUCCESS",
                message: "Tạo thanh toán COD thành công",
                data: result
            });
        } catch (error) {
            console.error("❌ Lỗi tạo thanh toán COD:", error);
            return res.status(500).json({
                code: "99",
                status: "ERROR",
                message: "Lỗi tạo thanh toán COD",
                data: null
            });
        }
    }

    async updatePaymentStatus(req, res) {
        const { order_id, payment_method, payment_status } = req.body;

        if (!order_id || !payment_method || !payment_status) {
            return res.status(400).json({
                code: "01",
                status: "BAD_REQUEST",
                message: "Thiếu thông tin bắt buộc",
                data: null
            });
        }

        try {
            const result = await PaymentService.updatePaymentStatus(
                order_id,
                payment_method,
                payment_status
            );

            return res.status(200).json({
                code: "00",
                status: "SUCCESS",
                message: "Cập nhật thanh toán thành công",
                data: result
            });
        } catch (error) {
            console.error("❌ Lỗi cập nhật thanh toán:", error);
            return res.status(500).json({
                code: "99",
                status: "ERROR",
                message: "Lỗi cập nhật thanh toán",
                data: null
            });
        }
    }
}

module.exports = new PaymentController();
