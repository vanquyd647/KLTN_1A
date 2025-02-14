// Trong utils/helpers.js
const generateShortId = () => {
    // Tạo chuỗi ngẫu nhiên 10 ký tự từ các ký tự cho phép
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
export default generateShortId;