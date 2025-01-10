const crypto = require('crypto');
const otpStore = new Map(); // Bộ nhớ tạm để lưu OTP và trạng thái xác thực
const moment = require('moment-timezone');

class OtpService {
    /**
     * Tạo OTP ngẫu nhiên
     * @returns {number} - Mã OTP gồm 6 chữ số
     */
    static generateOtp() {
        return crypto.randomInt(100000, 999999); // Tạo mã OTP từ 100000 đến 999999
    }

    /**
     * Lưu OTP vào bộ nhớ tạm thời với thời gian hết hạn
     * @param {string} email - Email của người dùng
     * @param {number} otp - Mã OTP
     * @param {number} expiresIn - Thời gian hết hạn tính bằng giây (mặc định: 300 giây)
     */
    static saveOtp(email, otp, expiresIn = 300) {
        const expirationTime = Date.now() + expiresIn * 1000; // Tính thời gian hết hạn
        otpStore.set(email, { otp, expirationTime, email, isVerified: false }); // Lưu OTP vào bộ nhớ tạm
        console.log(`OTP ${otp} đã được lưu cho email ${email}, hết hạn vào ${moment(expirationTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')}`);
    }

    /**
     * Xác minh OTP cho email
     * @param {string} email - Email của người dùng
     * @param {number|string} otp - Mã OTP cần xác minh
     * @returns {boolean} - Trả về true nếu OTP hợp lệ, ngược lại trả về false
     */
    static verifyOtp(email, otp) {
        const data = otpStore.get(email); // Lấy dữ liệu OTP từ bộ nhớ tạm
        if (!data) {
            console.log('Không tìm thấy OTP cho email:', email);
            return false;
        }

        const expirationTime = moment(data.expirationTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
        const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

        console.log('OTP đã lưu:', data.otp, `(type: ${typeof data.otp})`);
        console.log('OTP nhận được:', otp, `(type: ${typeof otp})`);
        console.log('Thời gian hết hạn:', expirationTime);
        console.log('Thời gian hiện tại:', currentTime);

        // Kiểm tra nếu OTP đã hết hạn
        if (moment().isAfter(moment(data.expirationTime))) {
            console.log('OTP đã hết hạn');
            otpStore.delete(email); // Xóa OTP khỏi bộ nhớ tạm
            return false;
        }

        // Kiểm tra nếu OTP khớp
        if (String(data.otp) === String(otp)) {
            data.isVerified = true; // Đánh dấu trạng thái đã xác minh
            otpStore.set(email, data); // Cập nhật trạng thái vào bộ nhớ
            console.log('OTP hợp lệ');
            return true;
        }

        console.log('OTP không khớp');
        return false;
    }

    /**
     * Kiểm tra trạng thái xác thực OTP
     * @param {string} email - Email của người dùng
     * @returns {boolean} - Trả về true nếu OTP đã được xác thực
     */
    static isOtpVerified(email) {
        const data = otpStore.get(email);
        return data?.isVerified || false; // Kiểm tra trạng thái isVerified
    }

    /**
     * Xóa OTP khỏi bộ nhớ tạm sau khi sử dụng
     * @param {string} email - Email của người dùng
     */
    static clearOtp(email) {
        otpStore.delete(email);
    }
}

module.exports = OtpService;
