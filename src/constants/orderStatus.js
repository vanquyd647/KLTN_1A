// constants/orderStatus.js
const ORDER_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
    FAILED: 'failed',
    IN_PAYMENT: 'in_payment',
    IN_PROGRESS: 'in_progress',
    SHIPPING: 'shipping'
};

const PAYMENT_STATUS = {
    PAID: 'paid',
    PENDING: 'pending',
    PROCESSING: 'processing',
    CANCELLED: 'cancelled'
};

const PAYMENT_LOG_STATUS = {
    INITIATED: 'initiated',
    SUCCESS: 'success',
    FAILURE: 'failure',
    CANCELLED: 'cancelled',
    PENDING: 'pending'
};

module.exports = {
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_LOG_STATUS
};
