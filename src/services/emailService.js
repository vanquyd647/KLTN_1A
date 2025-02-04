"use strict";

/**
 * @file Email service module using Nodemailer for sending emails and OTPs.
 */

const nodemailer = require('nodemailer');

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
        console.error('Lỗi kết nối transporter:', error);
    } else {
        console.log('Email transporter sẵn sàng gửi mail');
    }
});

class EmailService {
    /**
     * Sends an email.
     * 
     * @async
     * @static
     * @function sendMail
     * @param {string} to - Recipient email address.
     * @param {string} subject - Subject of the email.
     * @param {string} text - Email content in plain text.
     * @returns {Promise<boolean>} Resolves to `true` if the email is sent successfully.
     * @throws {Error} Throws an error if email sending fails.
     * 
     * @example
     * EmailService.sendMail('example@example.com', 'Test Subject', 'Hello, this is a test email.')
     *  .then(() => console.log('Email sent successfully'))
     *  .catch(error => console.error(error));
     */
    static async sendMail(to, subject, text) {
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
            console.error('Lỗi khi gửi email:', error);
            throw new Error('Không thể gửi email');
        }
    }

    /**
     * Sends an OTP email to the specified recipient.
     * 
     * @async
     * @static
     * @function sendOtpEmail
     * @param {string} email - Recipient email address.
     * @param {string} otp - One-time password (OTP) to be sent.
     * @returns {Promise<boolean>} Resolves to `true` if the OTP email is sent successfully.
     * @throws {Error} Throws an error if OTP email sending fails.
     * 
     * @example
     * EmailService.sendOtpEmail('example@example.com', '123456')
     *  .then(() => console.log('OTP email sent successfully'))
     *  .catch(error => console.error(error));
     */
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
