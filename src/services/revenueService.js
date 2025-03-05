const { Revenue, Order, Payment } = require('../models');
const { Op } = require('sequelize');

class RevenueService {
    // revenueService.js
    static async getRevenueStats(filters = {}) {
        try {
            const whereClause = {};

            if (filters.startDate || filters.endDate) {
                whereClause.created_at = {};

                if (filters.startDate) {
                    // Đặt thời gian bắt đầu là 00:00:00
                    const startDate = new Date(filters.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    whereClause.created_at[Op.gte] = startDate;
                }

                if (filters.endDate) {
                    // Đặt thời gian kết thúc là 23:59:59.999
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    whereClause.created_at[Op.lte] = endDate;
                }
            }

            console.log('Where clause:', whereClause); // Debug

            const revenues = await Revenue.findAll({
                where: whereClause,
                include: [
                    {
                        model: Order,
                        as: 'order'
                    },
                    {
                        model: Payment,
                        as: 'payment'
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            const totalRevenue = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0);

            return {
                revenues,
                totalRevenue,
                count: revenues.length
            };
        } catch (error) {
            console.error('Lỗi khi lấy thống kê doanh thu:', error);
            throw error;
        }
    }


    static async getDailyRevenue(date) {
        try {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const revenues = await Revenue.findAll({
                where: {
                    created_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: Order,
                        as: 'order'
                    },
                    {
                        model: Payment,
                        as: 'payment'
                    }
                ]
            });

            return {
                date: date,
                revenues,
                totalAmount: revenues.reduce((sum, rev) => sum + Number(rev.amount), 0),
                count: revenues.length
            };
        } catch (error) {
            console.error('Lỗi khi lấy doanh thu theo ngày:', error);
            throw error;
        }
    }

    static async getMonthlyRevenue(year, month) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            const revenues = await Revenue.findAll({
                where: {
                    created_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: Order,
                        as: 'order'
                    },
                    {
                        model: Payment,
                        as: 'payment'
                    }
                ]
            });

            return {
                year,
                month,
                revenues,
                totalAmount: revenues.reduce((sum, rev) => sum + Number(rev.amount), 0),
                count: revenues.length
            };
        } catch (error) {
            console.error('Lỗi khi lấy doanh thu theo tháng:', error);
            throw error;
        }
    }
}

module.exports = RevenueService;
