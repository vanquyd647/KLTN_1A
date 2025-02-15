const cron = require('node-cron');
const OrderService = require('../services/orderService');
const logger = require('../configs/winston');

// Chạy mỗi 5 phút
cron.schedule('*/5 * * * *', async () => {
    logger.info('Running order cleanup cron job');
    try {
        await OrderService.cancelExpiredOrders();
        logger.info('Order cleanup completed successfully');
    } catch (error) {
        logger.error('Order cleanup failed:', error);
    }
});
