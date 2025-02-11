"use strict";

const crypto = require('crypto');
const otpStore = new Map(); // Temporary storage for OTPs
const logger = require('../configs/winston');
const moment = require('moment-timezone');

const otpService = {
    /**
     * Generate a random OTP
     * @returns {number} - A 6-digit OTP code
     */
    generateOtp() {
        return crypto.randomInt(100000, 999999);
    },

    /**
     * Save OTP into temporary storage with expiration time
     * @param {string} email - User's email
     * @param {number} otp - OTP code
     * @param {number} expiresIn - Expiration time in seconds (default: 300s)
     */
    saveOtp(email, otp, expiresIn = 300) {
        const expirationTime = Date.now() + expiresIn * 1000;
        otpStore.set(email, { otp, expirationTime, email, isVerified: false });
        console.log(`OTP ${otp} saved for email ${email}, expires at ${moment(expirationTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')}`);
    },

    /**
     * Verify OTP for an email
     * @param {string} email - User's email
     * @param {number|string} otp - OTP to verify
     * @returns {boolean} - Returns true if OTP is valid, otherwise false
     */
    verifyOtp(email, otp) {
        const data = otpStore.get(email);
        if (!data) {
            logger.error('No OTP found for email:', email);
            console.log('No OTP found for email:', email);
            return false;
        }

        const expirationTime = moment(data.expirationTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
        const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

        console.log('Stored OTP:', data.otp, `(type: ${typeof data.otp})`);
        console.log('Received OTP:', otp, `(type: ${typeof otp})`);
        console.log('Expiration Time:', expirationTime);
        console.log('Current Time:', currentTime);

        if (moment().isAfter(moment(data.expirationTime))) {
            console.log('OTP expired');
            otpStore.delete(email);
            return false;
        }

        if (String(data.otp) === String(otp)) {
            data.isVerified = true;
            otpStore.set(email, data);
            console.log('OTP verified successfully');
            return true;
        }

        console.log('OTP does not match');
        return false;
    },

    /**
     * Check if OTP has been verified
     * @param {string} email - User's email
     * @returns {boolean} - Returns true if OTP has been verified
     */
    isOtpVerified(email) {
        const data = otpStore.get(email);
        return data?.isVerified || false;
    },

    /**
     * Clear OTP from temporary storage
     * @param {string} email - User's email
     */
    clearOtp(email) {
        otpStore.delete(email);
    }
};

// Export all functions as a module
module.exports = otpService;
