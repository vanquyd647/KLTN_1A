"use strict";

const { Session } = require('../models'); // Adjust the path based on your project structure
const logger = require('../configs/winston');
const { v4: uuidv4 } = require('uuid');

const sessionService = {
    // Thêm method mới để tìm session dựa trên IP và User Agent
    async findExistingSession(ipAddress, userAgent) {
        try {
            const session = await Session.findOne({
                where: {
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    status: 'active'
                },
                order: [['created_at', 'DESC']] // Lấy session mới nhất
            });
            return session;
        } catch (error) {
            logger.error('Error finding existing session:', error);
            return null;
        }
    },

    // Cập nhật method createSession
    async createSession(data) {
        try {
            // Kiểm tra session theo session_id
            if (data.session_id) {
                const existingSession = await Session.findByPk(data.session_id);
                if (existingSession) {
                    // Chỉ cập nhật status và thời gian truy cập
                    return await existingSession.update({
                        status: data.status || existingSession.status,
                        updated_at: new Date()
                    });
                }
            }

            // Kiểm tra session theo IP và User Agent
            const existingSession = await this.findExistingSession(
                data.ip_address,
                data.user_agent
            );

            if (existingSession) {
                // Trả về session hiện có và cập nhật thời gian
                return await existingSession.update({
                    updated_at: new Date()
                });
            }

            // Chỉ tạo session mới nếu không tìm thấy session nào
            return await Session.create({
                session_id: data.session_id || uuidv4(),
                user_id: data.user_id || null,
                ip_address: data.ip_address || null,
                user_agent: data.user_agent || null,
                status: data.status || 'active'
            });
        } catch (error) {
            logger.error('Error creating/updating session:', error);
            throw error;
        }
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
