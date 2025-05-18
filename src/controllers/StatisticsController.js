const StatisticsService = require('../services/StatisticsService');
const logger = require('../configs/winston');

class StatisticsController {
    async getSalesStatistics(req, res) {
        try {
            const result = await StatisticsService.getSalesStatistics();
            
            if (!result.success) {
                logger.error('Failed to get sales statistics:', result.error);
                return res.status(500).json({
                    status: 'error',
                    code: 500,
                    message: result.error || 'Không thể lấy thống kê bán hàng'
                });
            }

            return res.status(200).json({
                status: 'success',
                code: 200,
                data: result.data
            });
        } catch (error) {
            logger.error('Error in getSalesStatistics controller:', error);
            return res.status(500).json({
                status: 'error',
                code: 500,
                message: 'Đã xảy ra lỗi khi lấy thống kê bán hàng'
            });
        }
    }

    async getSalesByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'
                });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD'
                });
            }

            if (start > end) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'
                });
            }

            const result = await StatisticsService.getSalesByDateRange(startDate, endDate);

            if (!result.success) {
                logger.error('Failed to get sales statistics by date range:', result.error);
                return res.status(500).json({
                    status: 'error',
                    code: 500,
                    message: result.error || 'Không thể lấy thống kê bán hàng theo ngày'
                });
            }

            return res.status(200).json({
                status: 'success',
                code: 200,
                data: result.data
            });
        } catch (error) {
            logger.error('Error in getSalesByDateRange controller:', error);
            return res.status(500).json({
                status: 'error',
                code: 500,
                message: 'Đã xảy ra lỗi khi lấy thống kê bán hàng theo ngày'
            });
        }
    }
}

module.exports = new StatisticsController();
