"use strict";

const { User, UserRole, Role } = require('../models'); // Import models
const bcrypt = require('bcrypt');

class UserService {
    /**
     * Create a new user
     * @async
     * @param {Object} userData - Data for the new user
     * @returns {Promise<Object>} - Created user
     */
    static async createUser(userData) {
        const { password, ...otherData } = userData;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            ...otherData,
            password: hashedPassword,
        });

        return user;
    }

    /**
     * Find a user by email
     * @async
     * @param {string} email - Email of the user
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    static async findUserByEmail(email) {
        return await User.findOne({ where: { email } });
    }

    /**
     * Authenticate user by email and password
     * @async
     * @param {string} email - Email of the user
     * @param {string} password - Password of the user
     * @returns {Promise<Object|null>} - User object or null if authentication fails
     * @throws {Error} If authentication fails
     */
    static async authenticateUser(email, password) {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        return user;
    }

    /**
     * Get user by ID
     * @async
     * @param {number} userId - ID of the user
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    static async getUserById(userId) {
        return await User.findByPk(userId);
    }

    /**
     * Assign a role to a user
     * @async
     * @param {number} userId - ID of the user
     * @param {number} roleId - ID of the role
     * @returns {Promise<Object>} - Assigned UserRole
     */
    static async assignRoleToUser(userId, roleId) {
        return await UserRole.create({
            user_id: userId,
            role_id: roleId,
        });
    }

    /**
     * Get roles for a user
     * @async
     * @param {number} userId - ID of the user
     * @returns {Promise<Array<string>>} - List of role names
     */
    static async getUserRoles(userId) {
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
}

module.exports = UserService;
