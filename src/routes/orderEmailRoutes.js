const express = require('express');
const router = express.Router();
const orderEmailController = require('../controllers/orderEmailController');

// Route để gửi email xác nhận đơn hàng
router.post('/send-order-confirmation', orderEmailController.sendOrderConfirmation);

module.exports = router;
