const OrderService = require('../services/orderService');

class OrderController {
    static async createOrder(req, res) {
        try {
            const userId = req.userId || null;
            const orderData = { ...req.body, user_id: userId };

            const jobId = await OrderService.createOrder(orderData);
            res.status(202).json({
                status: 'success',
                code: 202,
                message: 'Order is being processed',
                jobId: jobId
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message
            });
        }
    }

    static async getOrderById(req, res) {
        try {
            const order = await OrderService.getOrderById(req.params.orderId);
            if (!order) {
                return res.status(404).json({
                    status: 'error',
                    code: 404,
                    message: 'Order not found'
                });
            }
            res.json({
                status: 'success',
                code: 200,
                message: 'Order retrieved successfully',
                data: order
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message
            });
        }
    }

    static async updateOrderStatus(req, res) {
        try {
            const success = await OrderService.updateOrderStatus(req.params.orderId, req.body.status);
            if (!success) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Invalid status update'
                });
            }
            res.json({
                status: 'success',
                code: 200,
                message: 'Order status updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message
            });
        }
    }

    static async cancelExpiredOrders(req, res) {
        try {
            await OrderService.cancelExpiredOrders();
            res.json({
                status: 'success',
                code: 200,
                message: 'Expired orders canceled successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message
            });
        }
    }

    static async completeOrder(req, res) {
        try {
            const success = await OrderService.completeOrder(req.params.orderId);
            if (!success) {
                return res.status(400).json({
                    status: 'error',
                    code: 400,
                    message: 'Order could not be completed'
                });
            }
            res.json({
                status: 'success',
                code: 200,
                message: 'Order completed successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message
            });
        }
    }

    static async deleteOrder(req, res) {
        try {
            const success = await OrderService.deleteOrder(req.params.orderId);
            if (!success) {
                return res.status(404).json({
                    status: 'error',
                    code: 404,
                    message: 'Order not found'
                });
            }
            res.json({
                status: 'success',
                code: 200,
                message: 'Order deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message
            });
        }
    }
}

module.exports = OrderController;
