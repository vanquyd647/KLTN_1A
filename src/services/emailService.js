"use strict";

/**
 * @file Email service module using Nodemailer for sending emails and OTPs.
 */

const nodemailer = require('nodemailer');
const logger = require('../configs/winston');

/**
 * Nodemailer transporter configuration using Gmail service.
 * 
 * @constant {Object} transporter
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Read from environment variables
        pass: process.env.EMAIL_PASS  // Read from environment variables
    }
});

/**
 * Verifies the connection to the email server.
 * Logs success or error message to the console.
 */
transporter.verify((error, success) => {
    if (error) {
        logger.error('Error connecting transporter:', error);
        console.error('Lỗi kết nối transporter:', error);
    } else {
        console.log('Email transporter sẵn sàng gửi mail');
    }
});

const emailService = {
    /**
     * Sends an email.
     * 
     * @async
     * @function sendMail
     * @param {string} to - Recipient email address.
     * @param {string} subject - Subject of the email.
     * @param {string} text - Email content in plain text.
     * @returns {Promise<boolean>} Resolves to `true` if the email is sent successfully.
     * @throws {Error} Throws an error if email sending fails.
     * 
     * @example
     * emailService.sendMail('example@example.com', 'Test Subject', 'Hello, this is a test email.')
     *  .then(() => console.log('Email sent successfully'))
     *  .catch(error => console.error(error));
     */
    // Sửa lại phương thức sendMail
    async sendMail(to, subject, text, html) { // Thêm tham số html
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html // Thêm html vào mailOptions
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email đã được gửi:', info.response);
            return true;
        } catch (error) {
            logger.error('Error sending email:', error);
            console.error('Lỗi khi gửi email:', error);
            throw new Error('Không thể gửi email');
        }
    },

    /**
     * Sends an OTP email to the specified recipient.
     * 
     * @async
     * @function sendOtpEmail
     * @param {string} email - Recipient email address.
     * @param {string} otp - One-time password (OTP) to be sent.
     * @returns {Promise<boolean>} Resolves to `true` if the OTP email is sent successfully.
     * @throws {Error} Throws an error if OTP email sending fails.
     * 
     * @example
     * emailService.sendOtpEmail('example@example.com', '123456')
     *  .then(() => console.log('OTP email sent successfully'))
     *  .catch(error => console.error(error));
     */
    async sendOtpEmail(email, otp) {
        const subject = 'Mã OTP của bạn';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50; text-align: center;">Mã Xác Thực OTP</h2>
                
                <p style="font-size: 16px; color: #333;">Xin chào,</p>
                
                <p style="font-size: 16px; color: #333;">Mã OTP của bạn để xác thực là:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; border: 1px dashed #007bff;">
                    <h3 style="color: #e74c3c; font-size: 24px; margin: 0;">${otp}</h3>
                </div>
    
                <p style="font-size: 14px; color: #555;">Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
    
                <div style="background-color: #fff8dc; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <strong>Lưu ý quan trọng:</strong>
                    <ul style="margin-top: 10px; padding-left: 20px; color: #555;">
                        <li>Không chia sẻ mã OTP với bất kỳ ai</li>
                        <li>Nếu bạn không yêu cầu mã này, hãy bỏ qua email</li>
                        <li>Mã sẽ hết hạn sau 5 phút</li>
                    </ul>
                </div>
    
                <p style="font-size: 14px; color: #555;">Nếu bạn gặp vấn đề, vui lòng liên hệ với đội ngũ hỗ trợ.</p>
    
                <hr style="border: 1px solid #eee; margin: 20px 0;">
    
                <p style="color: #888; font-size: 12px; text-align: center;">
                    Email này được gửi tự động, vui lòng không trả lời.
                </p>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email OTP đã được gửi:', info.response);
            return true;
        } catch (error) {
            logger.error('Lỗi khi gửi email OTP:', error);
            throw new Error('Không thể gửi email OTP');
        }
    },

    /**
 * Sends a password reset OTP email to the specified recipient.
 * 
 * @async
 * @function sendPasswordResetOtp
 * @param {string} email - Recipient email address.
 * @param {string} otp - One-time password (OTP) for password reset.
 * @returns {Promise<boolean>} Resolves to `true` if the email is sent successfully.
 * @throws {Error} Throws an error if email sending fails.
 * 
 * @example
 * emailService.sendPasswordResetOtp('example@example.com', '123456')
 *  .then(() => console.log('Password reset OTP sent successfully'))
 *  .catch(error => console.error(error));
 */
    async sendPasswordResetOtp(email, otp) {
        const subject = 'Đặt lại mật khẩu';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Đặt lại mật khẩu</h2>
                
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #e74c3c; margin: 0;">Mã OTP của bạn: ${otp}</h3>
                </div>
                
                <div style="background-color: #fff8dc; padding: 15px; margin: 20px 0;">
                    <strong>Lưu ý quan trọng:</strong>
                    <ul style="margin-top: 10px;">
                        <li>Mã này sẽ hết hạn sau 5 phút</li>
                        <li>Không chia sẻ mã này với bất kỳ ai</li>
                        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                    </ul>
                </div>
                
                <p>Nếu bạn gặp bất kỳ vấn đề gì, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
                
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                
                <p style="color: #666; font-size: 12px;">
                    Email này được gửi tự động, vui lòng không trả lời.
                </p>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email đặt lại mật khẩu đã được gửi:', info.response);
            return true;
        } catch (error) {
            logger.error('Error sending password reset email:', error);
            throw new Error('Không thể gửi email đặt lại mật khẩu');
        }
    }


};

// Export all functions inside an object
module.exports = emailService;
