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
    async sendMail(to, subject, text) {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender email address
            to, // Recipient email address
            subject, // Email subject
            text // Email body (plain text)
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
        const text = `Xin chào,

Mã OTP của bạn là: ${otp}

Mã này sẽ hết hạn sau 5 phút. Nếu bạn không yêu cầu mã OTP, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ hỗ trợ.`;

        return this.sendMail(email, subject, text);
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
