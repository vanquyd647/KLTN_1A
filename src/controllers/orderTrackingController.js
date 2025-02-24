const orderTrackingService = require('../services/orderTrackingService');
const logger = require('../configs/winston');

const orderTrackingController = {
    async trackOrder(req, res) {
        try {
            const { orderId } = req.params;
            const { identifier } = req.query; // email hoặc số điện thoại

            // Validate input
            if (!orderId || !identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp mã đơn hàng và email/số điện thoại'
                });
            }

            // Gọi service để lấy thông tin
            const orderInfo = await orderTrackingService.trackOrder(orderId, identifier);

            // Log thành công
            logger.info(`Tra cứu đơn hàng thành công - OrderID: ${orderId}`);

            // Trả về kết quả
            return res.status(200).json({
                success: true,
                message: 'Tra cứu đơn hàng thành công',
                data: orderInfo
            });

        } catch (error) {
            // Log lỗi
            logger.error(`Lỗi khi tra cứu đơn hàng: ${error.message}`);

            // Trả về thông báo lỗi
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = orderTrackingController;
