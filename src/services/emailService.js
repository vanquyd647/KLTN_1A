const nodemailer = require('nodemailer');

// Cấu hình transporter sử dụng Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Đọc từ biến môi trường
        pass: process.env.EMAIL_PASS  // Đọc từ biến môi trường
    }
});

// Kiểm tra kết nối transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('Lỗi kết nối transporter:', error);
    } else {
        console.log('Email transporter sẵn sàng gửi mail');
    }
});

class EmailService {
    // Gửi email
    static async sendMail(to, subject, text) {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Địa chỉ gửi
            to, // Địa chỉ nhận
            subject, // Chủ đề email
            text // Nội dung email (plain text)
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email đã được gửi:', info.response);
            return true;
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            throw new Error('Không thể gửi email');
        }
    }

    // Gửi OTP
    static async sendOtpEmail(email, otp) {
        const subject = 'Mã OTP của bạn';
        const text = `Xin chào,

Mã OTP của bạn là: ${otp}

Mã này sẽ hết hạn sau 5 phút. Nếu bạn không yêu cầu mã OTP, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ hỗ trợ.`;

        return this.sendMail(email, subject, text);
    }
}

module.exports = EmailService;
