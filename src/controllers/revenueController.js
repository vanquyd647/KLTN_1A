const RevenueService = require('../services/revenueService');

class RevenueController {
    static async getRevenueStats(req, res) {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            const stats = await RevenueService.getRevenueStats(filters);

            res.json({
                code: 200,
                status: 'success',
                message: 'Lấy thống kê doanh thu thành công',
                data: stats
            });
        } catch (error) {
            console.error('Lỗi controller doanh thu:', error);
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Đã có lỗi xảy ra khi lấy thống kê doanh thu',
                error: error.message
            });
        }
    }

    static async getDailyRevenue(req, res) {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const revenue = await RevenueService.getDailyRevenue(date);

            res.json({
                code: 200,
                status: 'success',
                message: 'Lấy doanh thu theo ngày thành công',
                data: revenue
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Đã có lỗi xảy ra khi lấy doanh thu theo ngày',
                error: error.message
            });
        }
    }

    static async getMonthlyRevenue(req, res) {
        try {
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;
            
            const revenue = await RevenueService.getMonthlyRevenue(year, month);

            res.json({
                code: 200,
                status: 'success',
                message: 'Lấy doanh thu theo tháng thành công',
                data: revenue
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Đã có lỗi xảy ra khi lấy doanh thu theo tháng',
                error: error.message
            });
        }
    }
}

module.exports = RevenueController;
