"use strict";

const { Session } = require('../models'); // Adjust the path based on your project structure
const logger = require('../configs/winston');
const { v4: uuidv4 } = require('uuid');

const sessionService = {
    /**
     * Create a new session
     * @param {Object} data - Session data
     * @returns {Promise<Object>} - The created session
     */
    async createSession(data) {
        const sessionId = data.session_id || uuidv4();
        const session = await Session.create({
            session_id: sessionId,
            user_id: data.user_id || null, // Null for guest users
            ip_address: data.ip_address || null,
            user_agent: data.user_agent || null,
            status: data.status || 'active',
        });
        return session;
    },

    /**
     * Get a session by ID
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object|null>} - The session or null if not found
     */
    async getSessionById(sessionId) {
        return await Session.findByPk(sessionId);
    },

    /**
     * Get active sessions for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - List of active sessions
     */
    async getActiveSessionsByUserId(userId) {
        return await Session.findAll({
            where: {
                user_id: userId,
                status: 'active',
            },
        });
    },

    /**
     * Update a session
     * @param {string} sessionId - Session ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>} - The updated session or null if not found
     */
    async updateSession(sessionId, updates) {
        const session = await Session.findByPk(sessionId);
        if (!session) return null;
        return await session.update(updates);
    },

    /**
     * Delete a session
     * @param {string} sessionId - Session ID
     * @returns {Promise<boolean>} - True if deleted, false otherwise
     */
    async deleteSession(sessionId) {
        const deletedCount = await Session.destroy({ where: { session_id: sessionId } });
        return deletedCount > 0;
    },

    /**
     * Get or create a session for a guest
     * @param {Object} data - Session data (IP, User Agent, etc.)
     * @returns {Promise<Object>} - The session
     */
    async getOrCreateGuestSession(data) {
        const sessionId = data.session_id || uuidv4();
        let session = await Session.findByPk(sessionId);

        if (!session) {
            session = await this.createSession({
                session_id: sessionId,
                user_id: null, // Guest user
                ip_address: data.ip_address,
                user_agent: data.user_agent,
                status: 'active',
            });
        }

        return session;
    },
};

module.exports = sessionService;
