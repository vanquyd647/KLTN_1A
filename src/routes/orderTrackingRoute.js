const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');

// Route tra cứu đơn hàng
router.get('/:orderId', orderTrackingController.trackOrder);

module.exports = router;
