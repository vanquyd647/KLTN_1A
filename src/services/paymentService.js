const PayOS = require("@payos/node");
const { sequelize } = require("../models");
const Payment = require("../models/Payment")(sequelize);
const Order = require("../models/Order")(sequelize);
const PaymentLog = require("../models/PaymentLog")(sequelize);
const logger = require("../configs/winston");

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

const PaymentService = {
    createPayOSPayment: async (orderId, amount, email) => {
        const t = await sequelize.transaction();


        try {
            // Validate input
            if (!orderId || !amount || !email) {
                throw new Error('Thiếu thông tin bắt buộc: orderId, amount, hoặc email');
            }

            // Validate amount
            const parsedAmount = parseInt(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Số tiền không hợp lệ');
            }

            const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:3000';

            // Prepare payment data - sử dụng UUID trực tiếp
            const paymentData = {
                orderCode: orderId, // Sử dụng UUID trực tiếp
                amount: parsedAmount,
                description: `Thanh toán đơn hàng #${orderId}`,
                items: [{
                    name: `Đơn hàng #${orderId}`,
                    quantity: 1,
                    price: parsedAmount
                }],
                returnUrl: `${YOUR_DOMAIN}/payment/success`,
                cancelUrl: `${YOUR_DOMAIN}/payment/cancel`,
            };

            // Cập nhật trạng thái đơn hàng thành "in_payment"
            await Order.update({
                status: 'in_payment',
                updated_at: new Date()
            }, {
                where: { id: orderId },
                transaction: t
            });

            logger.info("💳 PayOS payment data:", paymentData);

            // Create payment link
            const paymentLinkResponse = await payos.createPaymentLink(paymentData);

            if (!paymentLinkResponse?.checkoutUrl) {
                throw new Error('Không nhận được URL thanh toán từ PayOS');
            }

            // Create payment record
            const payment = await Payment.create({
                order_id: orderId,
                payment_method: 'payos',
                payment_status: 'pending',
                payment_amount: parsedAmount,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction: t });

            // Create payment log
            await PaymentLog.create({
                order_id: orderId,
                status: 'initiated',
                created_at: new Date()
            }, { transaction: t });

            await t.commit();

            logger.info("✅ Payment created successfully:", {
                paymentId: payment.id,
                orderId,
                amount: parsedAmount
            });

            return paymentLinkResponse;

        } catch (error) {
            await t.rollback();

            logger.error("❌ Payment creation failed:", {
                error: error.message,
                stack: error.stack,
                orderId,
                amount
            });

            // Create failure log
            await PaymentLog.create({
                order_id: orderId,
                status: 'failure',
                created_at: new Date()
            }).catch(logError => {
                logger.error("Failed to create failure log:", logError);
            });

            throw new Error(`Lỗi tạo thanh toán: ${error.message}`);
        }
    },

    processPayOSWebhook: async (webhookData) => {
        const t = await sequelize.transaction();

        try {
            if (!webhookData?.orderCode) {
                throw new Error('Invalid webhook data received');
            }

            const { orderCode, status, transactionId } = webhookData;
            const orderId = orderCode.toString();

            logger.info("📌 Processing PayOS webhook:", {
                orderId,
                status,
                transactionId
            });

            // Validate payment status
            const validStatuses = ['pending', 'processing', 'paid', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Trạng thái thanh toán không hợp lệ: ${status}`);
            }

            // Update payment
            const [updateCount] = await Payment.update({
                payment_status: status,
                transaction_id: transactionId,
                payment_date: status === 'paid' ? new Date() : null,
                updated_at: new Date()
            }, {
                where: { order_id: orderId },
                transaction: t
            });

            if (updateCount === 0) {
                throw new Error(`Không tìm thấy payment với order_id: ${orderId}`);
            }

            // Create log
            await PaymentLog.create({
                order_id: orderId,
                status: status === 'paid' ? 'success' : status,
                created_at: new Date()
            }, { transaction: t });

            // Update order status
            if (status === 'paid') {
                await Order.update({
                    status: 'shipping',
                    updated_at: new Date()
                }, {
                    where: { id: orderId },
                    transaction: t
                });

            } else {
                await Order.update({
                    status: 'cancelled',
                    updated_at: new Date()
                }, {
                    where: { id: orderId },
                    transaction: t
                });
            }

            await t.commit();

            logger.info("✅ Webhook processed successfully:", {
                orderId,
                status,
                transactionId
            });

            return true;

        } catch (error) {
            await t.rollback();
            logger.error("❌ Webhook processing failed:", {
                error: error.message,
                stack: error.stack,
                webhookData
            });
            throw error;
        }
    },

    validateWebhookSignature: (webhookData, signature) => {
        try {
            const isValid = payos.verifyPaymentWebhookSignature(webhookData, signature);
            logger.info("🔐 Webhook signature validation:", {
                isValid,
                signature: signature?.substring(0, 10) + '...'
            });
            return isValid;
        } catch (error) {
            logger.error("❌ Signature validation failed:", {
                error: error.message,
                webhookData: JSON.stringify(webhookData).substring(0, 100) + '...'
            });
            return false;
        }
    },

    // Thêm vào PaymentService object
    createCODPayment: async (orderId, amount, email) => {
        const t = await sequelize.transaction();

        // Cập nhật trạng thái đơn hàng thành "in_payment"
        await Order.update({
            status: 'in_payment',
            updated_at: new Date()
        }, {
            where: { id: orderId },
            transaction: t
        });

        try {
            // Validate input
            if (!orderId || !amount || !email) {
                throw new Error('Thiếu thông tin bắt buộc: orderId, amount, hoặc email');
            }

            // Validate amount
            const parsedAmount = parseInt(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Số tiền không hợp lệ');
            }

            // Create payment record
            const payment = await Payment.create({
                order_id: orderId,
                payment_method: 'cash_on_delivery',
                payment_status: 'pending',
                payment_amount: parsedAmount,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction: t });

            // Create payment log
            await PaymentLog.create({
                order_id: orderId,
                status: 'initiated',
                created_at: new Date()
            }, { transaction: t });

            // update order status
            await Order.update({
                status: 'shipping',
                updated_at: new Date()
            }, {
                where: { id: orderId },
                transaction: t
            });

            await t.commit();

            logger.info("✅ COD Payment created successfully:", {
                paymentId: payment.id,
                orderId,
                amount: parsedAmount
            });

            return {
                success: true,
                payment_id: payment.id,
                order_id: orderId,
                amount: parsedAmount,
                payment_method: 'cash_on_delivery'
            };

        } catch (error) {
            await t.rollback();

            // update order status
            await Order.update({
                status: 'cancelled',
                updated_at: new Date()
            }, {
                where: { id: orderId },
                transaction: t
            });

            logger.error("❌ COD Payment creation failed:", {
                error: error.message,
                stack: error.stack,
                orderId,
                amount
            });

            // Create failure log
            await PaymentLog.create({
                order_id: orderId,
                status: 'failure',
                created_at: new Date()
            }).catch(logError => {
                logger.error("Failed to create failure log:", logError);
            });

            throw new Error(`Lỗi tạo thanh toán COD: ${error.message}`);
        }
    },

    // Thêm vào PaymentService object
    updatePaymentStatus: async (orderId, paymentMethod, paymentStatus) => {
        const t = await sequelize.transaction();

        try {
            // Validate payment method
            const validPaymentMethods = ['payos', 'cash_on_delivery'];
            if (!validPaymentMethods.includes(paymentMethod)) {
                throw new Error('Phương thức thanh toán không hợp lệ');
            }

            // Validate payment status
            const validPaymentStatuses = ['pending', 'processing', 'paid', 'cancelled'];
            if (!validPaymentStatuses.includes(paymentStatus)) {
                throw new Error('Trạng thái thanh toán không hợp lệ');
            }

            // Update payment record
            const [updateCount] = await Payment.update({
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                payment_date: paymentStatus === 'paid' ? new Date() : null,
                updated_at: new Date()
            }, {
                where: { order_id: orderId },
                transaction: t
            });

            if (updateCount === 0) {
                throw new Error(`Không tìm thấy payment với order_id: ${orderId}`);
            }

            // Map payment status sang payment log status
            let logStatus;
            switch (paymentStatus) {
                case 'paid':
                    logStatus = 'success';
                    break;
                case 'cancelled':
                    logStatus = 'cancelled';
                    break;
                case 'pending':
                    logStatus = 'pending';
                    break;
                case 'processing':
                    logStatus = 'initiated';
                    break;
                default:
                    logStatus = 'pending';
            }

            // Create payment log với logStatus đã được map
            await PaymentLog.create({
                order_id: orderId,
                status: logStatus,
                created_at: new Date()
            }, { transaction: t });

            // Update order status based on payment status
            let orderStatus;
            if (paymentStatus === 'paid') {
                orderStatus = 'shipping';
            } else if (paymentStatus === 'cancelled') {
                orderStatus = 'cancelled';
            } else {
                orderStatus = 'in_payment';
            }

            await Order.update({
                status: orderStatus,
                updated_at: new Date()
            }, {
                where: { id: orderId },
                transaction: t
            });

            await t.commit();

            logger.info("✅ Payment status updated successfully:", {
                orderId,
                paymentMethod,
                paymentStatus,
                orderStatus,
                logStatus
            });

            return {
                success: true,
                order_id: orderId,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                order_status: orderStatus
            };

        } catch (error) {
            await t.rollback();

            logger.error("❌ Payment status update failed:", {
                error: error.message,
                stack: error.stack,
                orderId,
                paymentMethod,
                paymentStatus
            });

            throw new Error(`Lỗi cập nhật trạng thái thanh toán: ${error.message}`);
        }
    },



};

module.exports = PaymentService;
