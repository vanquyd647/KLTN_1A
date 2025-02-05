"use strict";

const { User, UserRole, Role } = require('../models'); // Import models
const bcrypt = require('bcrypt');

const userService = {
    /**
     * Create a new user
     * @async
     * @param {Object} userData - Data for the new user
     * @returns {Promise<Object>} - Created user
     */
    async createUser(userData) {
        const { password, role, ...otherData } = userData;

        // Hash mật khẩu trước khi lưu vào DB
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tìm roleId dựa trên roleName đã được lưu trong userData
        const roleRecord = await Role.findOne({ where: { role_name: role } });

        if (!roleRecord) {
            throw new Error(`Vai trò '${role}' không hợp lệ.`);
        }

        // Tạo người dùng mới trong bảng User
        const user = await User.create({
            ...otherData,
            password: hashedPassword,
        });

        // Gán vai trò cho người dùng trong bảng UserRole
        await UserRole.create({
            user_id: user.id,
            role_id: roleRecord.id,
        });

        return user;
    },

    /**
     * Find a user by email
     * @async
     * @param {string} email - Email of the user
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    async findUserByEmail(email) {
        return await User.findOne({ where: { email } });
    },

    /**
     * Authenticate user by email and password
     * @async
     * @param {string} email - Email of the user
     * @param {string} password - Password of the user
     * @returns {Promise<Object|null>} - User object or null if authentication fails
     * @throws {Error} If authentication fails
     */
    async authenticateUser(email, password) {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        return user;
    },

    /**
     * Get user by ID
     * @async
     * @param {number} userId - ID of the user
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    async getUserById(userId) {
        return await User.findByPk(userId);
    },

    /**
     * Get roles for a user
     * @async
     * @param {number} userId - ID of the user
     * @returns {Promise<Array<string>>} - List of role names
     */
    async getUserRoles(userId) {
        const roles = await UserRole.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Role,
                    as: 'role', // Using alias defined in model
                },
            ],
        });

        // Return the list of role names
        return roles.map((userRole) => userRole.role.role_name);
    }
};

// Export all functions inside an object
module.exports = userService;
