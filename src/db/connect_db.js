// Import Sequelize từ thư viện
require('dotenv').config(); // Load environment variables từ .env file
const { Sequelize } = require('sequelize');

const testdb = process.env.DB_NAME || 'testdb';
const dbhost = process.env.DB_HOST || 'localhost';
const dbuser = process.env.DB_USER || 'root';
const dbpass = process.env.DB_PASS || 'root';
const dbdialect = process.env.DB_DIALECT || 'mysql';
const dbport = process.env.DB_PORT || 3306;

// Tạo kết nối với MariaDB bằng Sequelize
const sequelize = new Sequelize(testdb, dbuser, dbpass, {
    host: dbhost,
    dialect: dbdialect,  // Chỉ định MariaDB sử dụng dialect MySQL
    port: dbport,        // Port của MariaDB
    logging: console.log,  // Bật logging để xem chi tiết
    timezone: "+07:00",
});

// const sequelize = new Sequelize('testdb', 'admin', 'admin123', {
//     host: 'database-2.cvcqsyqyewxi.ap-southeast-1.rds.amazonaws.com',
//     dialect: 'mysql',
//     port: 3306,
//     logging: console.log,
// });


// Kiểm tra kết nối
async function testConnection() {
    try {
        await sequelize.authenticate();  // Kiểm tra kết nối
        console.log('Kết nối MariaDB thành công!');
    } catch (err) {
        console.error('Lỗi kết nối MariaDB:', err.message);
    }
}

// Gọi hàm kiểm tra kết nối
testConnection();

// Xuất đối tượng Sequelize để sử dụng trong các file khác
module.exports = sequelize;
