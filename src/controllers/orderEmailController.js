"use strict";

const emailService = require('../services/emailService');

const orderEmailController = {
    /**
     * Gửi email xác nhận đơn hàng
     */
    async sendOrderConfirmation(req, res) {
        try {
            const { checkoutItems, orderDetails } = req.body;

            console.log('Received order data:', {
                checkoutItems,
                orderDetails
            });

            // Kiểm tra dữ liệu đầu vào
            if (!checkoutItems || !orderDetails || !orderDetails.data) {
                return res.status(400).json({
                    code: 400,
                    status: 'error',
                    message: 'Dữ liệu đơn hàng không hợp lệ'
                });
            }

            // Tạo nội dung HTML cho email
            const orderItemsHtml = checkoutItems.map(item => `
                <tr>
                    <td>${item.product.product_name}</td>
                    <td>${item.color.name}</td>
                    <td>${item.size.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.product.price.toLocaleString('vi-VN')}đ</td>
                    <td>${(item.quantity * item.product.price).toLocaleString('vi-VN')}đ</td>
                </tr>
            `).join('');

            const subtotal = checkoutItems.reduce((total, item) => {
                return total + (item.quantity * item.product.price);
            }, 0);

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; text-align: center;">Xác Nhận Đơn Hàng #${orderDetails.data.order_id}</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                        <h3>Thông tin khách hàng:</h3>
                        <p>Tên: ${orderDetails.data.formData.name}</p>
                        <p>Email: ${orderDetails.data.formData.email}</p>
                        <p>Số điện thoại: ${orderDetails.data.formData.phone}</p>
                        <p>Địa chỉ: ${orderDetails.data.formData.street}, ${orderDetails.data.formData.ward}, 
                            ${orderDetails.data.formData.district}, ${orderDetails.data.formData.city}</p>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #007bff; color: white;">
                                <th style="padding: 10px;">Sản phẩm</th>
                                <th>Màu</th>
                                <th>Size</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderItemsHtml}
                        </tbody>
                    </table>

                    <div style="text-align: right; margin-top: 20px;">
                        <p>Phí vận chuyển: ${orderDetails.data.original_price.toLocaleString('vi-VN')}đ</p>
                        <p>Phí vận chuyển: ${orderDetails.data.shipping_fee.toLocaleString('vi-VN')}đ</p>
                        <p>Giảm giá: ${orderDetails.data.discount_amount.toLocaleString('vi-VN')}đ</p>
                        <h3>Tổng thanh toán: ${(orderDetails.data.amount).toLocaleString('vi-VN')}đ</h3>
                    </div>

                    <div style="background-color: #fff8dc; padding: 15px; margin: 20px 0;">
                        <p>Cảm ơn bạn đã mua hàng tại cửa hàng chúng tôi!</p>
                        <p>Đơn hàng của bạn sẽ được xử lý và giao trong thời gian sớm nhất.</p>
                    </div>
                </div>
            `;

            // Gửi email
            await emailService.sendMail(
                orderDetails.data.email,
                `Xác nhận đơn hàng #${orderDetails.data.order_id}`,
                '',
                html
            );

            res.status(200).json({
                code: 200,
                status: 'success',
                message: 'Email xác nhận đơn hàng đã được gửi'
            });

        } catch (error) {
            console.error('Lỗi khi gửi email xác nhận đơn hàng:', error);
            res.status(500).json({
                code: 500,
                status: 'error',
                message: 'Không thể gửi email xác nhận đơn hàng'
            });
        }
    }
};

module.exports = orderEmailController;
