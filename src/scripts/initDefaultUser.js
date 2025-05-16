// scripts/initDefaultUser.js
const { User, Role, UserRole } = require('../models');
const bcrypt = require('bcrypt');

const initDefaultUser = async () => {
    try {
        // Kiểm tra user đã tồn tại
        const existingUser = await User.findOne({
            where: {
                email: 'cskh@fashionstore.vn'
            }
        });

        if (existingUser) {
            console.log('Default user already exists');
            return;
        }

        // Tạo mật khẩu mặc định và mã hóa
        const defaultPassword = 'Fashion@123'; // Mật khẩu mặc định
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Tạo user mới
        const newUser = await User.create({
            email: 'cskh@fashionstore.vn',
            phone: '0999999999',
            firstname: 'Fashion',
            lastname: 'Store',
            gender: 'other', // Giá trị mặc định cho gender
            password: hashedPassword,
        });

        // Lấy role superadmin
        const superadminRole = await Role.findOne({
            where: {
                role_name: 'superadmin'
            }
        });

        if (superadminRole) {
            // Gán role superadmin cho user
            await UserRole.create({
                user_id: newUser.id,
                role_id: superadminRole.id
            });
        }

        console.log('Default user created successfully');
        console.log('User details:');
        console.log('- Email:', newUser.email);
        console.log('- Phone:', newUser.phone);
        console.log('- Name:', `${newUser.firstname} ${newUser.lastname}`);
        console.log('- Default password:', defaultPassword);
        console.log('Please change the password after first login!');

    } catch (error) {
        console.error('Error creating default user:', error);
    }
};

// Thực thi hàm
initDefaultUser();

module.exports = initDefaultUser;
