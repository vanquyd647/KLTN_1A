const { User, UserRole, Role } = require('../models'); // Import models
const bcrypt = require('bcrypt');

/**
 * Create a new user
 * @param {Object} userData - Data for the new user
 * @returns {Object} - Created user
 */
const createUser = async (userData) => {
    const { password, ...otherData } = userData;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        ...otherData,
        password: hashedPassword,
    });

    return user;
};

/**
 * Find a user by email
 * @param {string} email - Email of the user
 * @returns {Object|null} - User object or null if not found
 */
const findUserByEmail = async (email) => {
    const user = await User.findOne({ where: { email } });
    return user;
};

/**
 * Authenticate user by email and password
 * @param {string} email - Email of the user
 * @param {string} password - Password of the user
 * @returns {Object|null} - User object or null if authentication fails
 */
const authenticateUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }

    return user;
};

/**
 * Get user by ID
 * @param {number} userId - ID of the user
 * @returns {Object|null} - User object or null if not found
 */
const getUserById = async (userId) => {
    const user = await User.findByPk(userId);
    return user;
};

/**
 * Assign a role to a user
 * @param {number} userId - ID of the user
 * @param {number} roleId - ID of the role
 * @returns {Object} - Assigned UserRole
 */
const assignRoleToUser = async (userId, roleId) => {
    const userRole = await UserRole.create({
        user_id: userId,
        role_id: roleId,
    });

    return userRole;
};

/**
 * Get roles for a user
 * @param {number} userId - ID of the user
 * @returns {Array} - List of roles
 */
const getUserRoles = async (userId) => {
    const roles = await Role.findAll({
        include: [
            {
                model: UserRole,
                where: { user_id: userId },
            },
        ],
    });

    return roles;
};

module.exports = {
    createUser,
    findUserByEmail,
    authenticateUser,
    getUserById,  // Added this method
    assignRoleToUser,
    getUserRoles,
};
