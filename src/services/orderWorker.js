const { Worker } = require('bullmq');
const { createClient } = require('redis');
const OrderService = require('../services/orderService');
const logger = require('../configs/winston');
const { log } = require('winston');
require('dotenv').config();

// 🔥 Kết nối Redis
const redisQueueClient = createClient({
    socket: {
        host: '127.0.0.1', 
        port: 6381
    }
});

redisQueueClient.on('connect', () => console.log('✅ Worker kết nối Redis thành công!'));
redisQueueClient.on('error', (err) => console.error('❌ Lỗi Redis trong Worker:', err));

(async () => {
    try {
        await redisQueueClient.connect();
    } catch (error) {
        logger.error('❌ Lỗi khi kết nối Redis trong Worker:', error);
        console.error('❌ Không thể kết nối Redis trong Worker:', error);
    }
})();

// 🔥 Worker xử lý hàng đợi đơn hàng
const worker = new Worker('orderQueue', async (job) => {
    console.log(`🚀 Worker đang xử lý đơn hàng: ${job.id}`);
    console.log("📥 Dữ liệu nhận được trong Worker:", JSON.stringify(job.data, null, 2));

    if (!job.data.carrier_id || !job.data.original_price ||
        !job.data.discounted_price || !job.data.final_price || !job.data.items) {
        logger.error(`❌ Đơn hàng ${job.id} bị lỗi: Thiếu thông tin quan trọng!`);
        console.error(`❌ Đơn hàng ${job.id} bị lỗi: Thiếu thông tin quan trọng!`);

        // 🔴 Ghi nhận lỗi vào Redis
        await redisQueueClient.set(`orderResult:${job.id}`, JSON.stringify({ success: false, error: "Dữ liệu đơn hàng không hợp lệ" }), 'EX', 60);

        // 🚨 Ném lỗi để BullMQ ghi nhận thất bại
        logger.error("Dữ liệu đơn hàng không hợp lệ");
        throw new Error("Dữ liệu đơn hàng không hợp lệ");
    }

    try {
        // ✅ Xử lý đơn hàng
        const order = await OrderService.processOrder(job.data);

        console.log(`✅ Đơn hàng ${job.id} đã được xử lý thành công!`);

        // 🔵 Ghi nhận kết quả thành công vào Redis
        await redisQueueClient.set(`orderResult:${job.id}`, JSON.stringify({ success: true, orderId: order.id }), 'EX', 60);

        return { success: true, orderId: order.id };
    } catch (error) {
        logger.error(`❌ Lỗi khi xử lý đơn hàng ${job.id}: ${error.message}`);
        console.error(`❌ Lỗi khi xử lý đơn hàng ${job.id}: ${error.message}`);

        // ❌ Cập nhật trạng thái đơn hàng là "failed"
        await OrderService.updateOrderStatus(job.data.order_id, 'failed');

        // 🔴 Ghi nhận lỗi vào Redis để Controller có thể lấy phản hồi
        await redisQueueClient.set(`orderResult:${job.id}`, JSON.stringify({ success: false, error: error.message }), 'EX', 60);

        // 🚨 Ném lỗi để BullMQ ghi nhận thất bại
        throw new Error(error.message);
    }
}, {
    connection: {
        host: '127.0.0.1',
        port: 6381,
    }
});

// ✅ Lắng nghe sự kiện thành công
worker.on('completed', async (job, result) => {
    console.log(`✅ Đơn hàng ${job.id} hoàn tất!`, result);
});

// ❌ Lắng nghe sự kiện thất bại
worker.on('failed', async (job, err) => {
    logger.error(`❌ Đơn hàng ${job.id} thất bại: ${err.message}`);
    console.error(`❌ Đơn hàng ${job.id} thất bại: ${err.message}`);

    // 🔴 Ghi nhận lỗi vào Redis nếu chưa có
    const existingResult = await redisQueueClient.get(`orderResult:${job.id}`);
    if (!existingResult) {
        await redisQueueClient.set(`orderResult:${job.id}`, JSON.stringify({ success: false, error: err.message }), 'EX', 60);
    }
});

console.log('🔥 Worker đã khởi động...');

module.exports = worker;
