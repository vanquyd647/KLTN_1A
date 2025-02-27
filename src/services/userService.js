"use strict";

const { User, UserRole, Role, Cart } = require('../models'); // Import models
const { Op } = require('sequelize');
const logger = require('../configs/winston');
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
            logger.error(`Vai trò '${role}' không hợp lệ.`);
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
        // Tìm user và tất cả cart active
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Cart,
                where: { status: 'active' },
                required: false
            }]
        });

        if (!user) {
            logger.error('User not found');
            throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.error('Invalid password');
            throw new Error('Invalid password');
        }

        // Kiểm tra và xử lý cart
        let cart;
        if (user.Carts && user.Carts.length > 0) {
            // Nếu có nhiều cart active, lấy cart mới nhất
            cart = user.Carts.reduce((newest, current) => {
                return new Date(current.created_at) > new Date(newest.created_at) ? current : newest;
            });

            // Optional: Vô hiệu hóa các cart active cũ
            await Cart.update(
                { status: 'inactive' },
                {
                    where: {
                        user_id: user.id,
                        status: 'active',
                        id: { [Op.ne]: cart.id }
                    }
                }
            );
        } else {
            // Chỉ tạo cart mới nếu không có cart active nào
            cart = await Cart.create({
                user_id: user.id,
                status: 'active'
            });
        }

        // Tạo response object
        const userResponse = {
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone,
            gender: user.gender,
            cart_id: cart.id
        };

        return userResponse;
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
    },

    /**
 * Update user information
 * @async
 * @param {number} userId - ID of the user
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated user
 */
    async updateUser(userId, updateData) {
        try {
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('Người dùng không tồn tại');
            }

            // Lọc các trường được phép cập nhật
            const allowedFields = ['firstname', 'lastname', 'phone', 'gender'];
            const filteredData = Object.keys(updateData)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updateData[key];
                    return obj;
                }, {});

            // Cập nhật thông tin
            await user.update({
                ...filteredData,
                updated_at: new Date()
            });

            return {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                updated_at: user.updated_at
            };
        } catch (error) {
            logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    },

    async updatePassword(email, newPassword) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new Error('Người dùng không tồn tại');
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Cập nhật mật khẩu
            await user.update({
                password: hashedPassword,
                updated_at: new Date()
            });

            return true;
        } catch (error) {
            logger.error(`Error updating password: ${error.message}`);
            throw error;
        }
    },

    // Trong userService.js, hàm getAllUsers
    async getAllUsers(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const where = {};

            // Xử lý filters
            if (filters.email) {
                where.email = { [Op.like]: `%${filters.email}%` };
            }
            if (filters.phone) {
                where.phone = { [Op.like]: `%${filters.phone}%` };
            }
            if (filters.name) {
                where[Op.or] = [
                    { firstname: { [Op.like]: `%${filters.name}%` } },
                    { lastname: { [Op.like]: `%${filters.name}%` } }
                ];
            }

            const { count, rows } = await User.findAndCountAll({
                where,
                limit,
                offset,
                include: [{
                    model: UserRole,
                    as: 'userRoles', // Thêm alias này
                    include: [{
                        model: Role,
                        as: 'role'
                    }]
                }],
                order: [['created_at', 'DESC']]
            });

            const users = rows.map(user => ({
                id: user.id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                phone: user.phone,
                gender: user.gender,
                roles: user.userRoles.map(ur => ur.role.role_name), // Cập nhật cách truy cập
                created_at: user.created_at
            }));

            return {
                users,
                pagination: {
                    total: count,
                    page,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error(`Error getting users: ${error.message}`);
            throw error;
        }
    },

    async createUserByAdmin(userData) {
        try {
            const { password, roles, ...otherData } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);

            // Validate roles
            if (!roles || !Array.isArray(roles)) {
                throw new Error('Roles must be provided as an array');
            }

            const user = await User.create({
                ...otherData,
                password: hashedPassword
            });

            const roleRecords = await Role.findAll({
                where: { role_name: roles }
            });

            if (roleRecords.length !== roles.length) {
                throw new Error('One or more invalid roles provided');
            }

            await Promise.all(
                roleRecords.map(role =>
                    UserRole.create({
                        user_id: user.id,
                        role_id: role.id
                    })
                )
            );

            return user;
        } catch (error) {
            logger.error(`Error creating user by admin: ${error.message}`);
            throw error;
        }
    },

    async updateUserByAdmin(userId, updateData) {
        try {
            const { roles, password, ...userData } = updateData;
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Update user data
            if (Object.keys(userData).length > 0) {
                await user.update(userData);
            }

            // Update password if provided
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await user.update({ password: hashedPassword });
            }

            // Update roles if provided
            if (roles && Array.isArray(roles)) {
                await UserRole.destroy({ where: { user_id: userId } });

                const roleRecords = await Role.findAll({
                    where: { role_name: roles }
                });

                if (roleRecords.length !== roles.length) {
                    throw new Error('One or more invalid roles provided');
                }

                await Promise.all(
                    roleRecords.map(role =>
                        UserRole.create({
                            user_id: userId,
                            role_id: role.id
                        })
                    )
                );
            }

            return user;
        } catch (error) {
            logger.error(`Error updating user by admin: ${error.message}`);
            throw error;
        }
    },

    async deleteUser(userId) {
        try {
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('Người dùng không tồn tại');
            }

            // Kiểm tra nếu là superadmin
            const roles = await this.getUserRoles(userId);
            if (roles.includes('superadmin')) {
                throw new Error('Không thể xóa tài khoản SuperAdmin');
            }

            // Xóa các bản ghi liên quan
            await UserRole.destroy({ where: { user_id: userId } });

            // Xóa người dùng
            await user.destroy();

            return true;
        } catch (error) {
            logger.error(`Error deleting user: ${error.message}`);
            throw error;
        }
    }


};

// Export all functions inside an object
module.exports = userService;
