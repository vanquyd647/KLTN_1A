const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

/**
 * 📌 API tạo thanh toán với PayOS SDK
 */
router.post("/payos", paymentController.createPayOSPayment);

/**
 * 📌 API Webhook xử lý thanh toán PayOS
 */
router.post("/payos-webhook", paymentController.handlePayOSWebhook);

/**
 * 📌 API tạo thanh toán COD
 */
router.post("/cod", paymentController.createCODPayment);

module.exports = router;
