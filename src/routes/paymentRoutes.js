const express = require("express");
const router = express.Router();
const PaymentService = require("../services/paymentService");

/**
 * 📌 API tạo thanh toán với PayOS SDK
 */
router.post("/payos", async (req, res) => {
    const { order_id, amount, email } = req.body;

    if (!order_id || !amount || !email) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    try {
        const checkoutUrl = await PaymentService.createPayOSPayment(order_id, amount, email);
        res.status(200).json({ checkoutUrl });
    } catch (error) {
        console.error("❌ Lỗi tạo thanh toán với PayOS:", error);
        res.status(500).json({ message: "Lỗi tạo thanh toán với PayOS" });
    }
});

/**
 * 📌 API Webhook xử lý thanh toán PayOS
 */
router.post("/payos-webhook", async (req, res) => {
    try {
        await PaymentService.processPayOSWebhook(req.body);
        res.status(200).json({ message: "Webhook xử lý thành công" });
    } catch (error) {
        console.error("❌ Lỗi xử lý webhook PayOS:", error);
        res.status(500).json({ message: "Lỗi xử lý webhook PayOS" });
    }
});

module.exports = router;
