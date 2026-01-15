/**
 * PAN Verification Service
 * Handles PAN verification and management for users
 */

const axios = require('axios');
const enterpriseLogger = require('../utils/logger');
const { User } = require('../models');

class PANVerificationService {
    /**
     * Verify PAN with government API (mock for now)
     * @param {string} pan - PAN number to verify
     * @param {string} dob - Date of birth (optional)
     * @returns {Promise<Object>} Verification result
     */
    static async verifyPAN(pan, dob = null) {
        try {
            // TODO: Integrate with actual PAN verification API
            // For now, mock verification

            // Validate PAN format
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(pan.toUpperCase())) {
                return {
                    success: false,
                    error: 'Invalid PAN format',
                };
            }

            // Mock API response
            const mockResponse = {
                success: true,
                data: {
                    pan: pan.toUpperCase(),
                    name: 'Mock Name', // Would come from API
                    category: 'Individual', // Individual, HUF, Company, etc.
                    verified: true,
                },
            };

            enterpriseLogger.info('PAN verified', { pan: pan.toUpperCase() });
            return mockResponse;

        } catch (error) {
            enterpriseLogger.error('PAN verification error', {
                pan,
                error: error.message,
            });
            return {
                success: false,
                error: 'PAN verification failed',
            };
        }
    }

    /**
     * Add verified PAN to user profile
     * @param {Object} user - User instance
     * @param {string} pan - PAN number
     * @param {string} label - Label for PAN (e.g., "Self", "Spouse")
     * @param {Object} metadata - Additional metadata from verification
     * @returns {Promise<Object>} Updated user
     */
    static async addVerifiedPAN(userPayload, pan, label = 'Self', metadata = {}) {
        try {
            // Fetch actual User model instance from database
            // JWT payload contains: { userId, email, role, iat, exp }
            const user = await User.findByPk(userPayload.userId);
            if (!user) {
                enterpriseLogger.error('User not found in database', {
                    userId: userPayload.userId,
                });
                throw new Error('User not found');
            }

            const verifiedPans = user.verifiedPans || [];

            // Check if PAN already exists
            const existingIndex = verifiedPans.findIndex(p => p.pan === pan.toUpperCase());

            if (existingIndex !== -1) {
                // Update existing PAN
                verifiedPans[existingIndex] = {
                    ...verifiedPans[existingIndex],
                    label,
                    name: metadata?.name || verifiedPans[existingIndex].name, // Preserve or update name
                    metadata,
                    verifiedAt: new Date(),
                };
            }
            else {
                // Add new PAN
                const isFirst = verifiedPans.length === 0;
                verifiedPans.push({
                    pan: pan.toUpperCase(),
                    label,
                    name: metadata?.name || 'Unknown', // Store PAN holder name
                    verifiedAt: new Date(),
                    isDefault: isFirst, // First PAN is default
                    metadata,
                });
            }

            user.verifiedPans = verifiedPans;
            // CRITICAL: Mark field as changed for Sequelize to persist JSONB updates
            user.changed('verifiedPans', true);
            await user.save();

            enterpriseLogger.info('PAN added to user profile', {
                userId: user.id,
                pan: pan.toUpperCase(),
                label,
                verifiedPansCount: verifiedPans.length,
            });

            return user;

        } catch (error) {
            enterpriseLogger.error('Add verified PAN error', {
                userId: userPayload?.id,
                pan,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Remove verified PAN from user profile
     * @param {Object} user - User instance
     * @param {string} pan - PAN number to remove
     * @returns {Promise<Object>} Updated user
     */
    static async removeVerifiedPAN(userPayload, pan) {
        try {
            // Fetch actual User model instance from database
            const user = await User.findByPk(userPayload.userId);
            if (!user) {
                throw new Error('User not found');
            }

            const verifiedPans = user.verifiedPans || [];
            const filteredPans = verifiedPans.filter(p => p.pan !== pan.toUpperCase());

            // If removed PAN was default, make first remaining PAN default
            if (filteredPans.length > 0) {
                const hadDefault = verifiedPans.some(p => p.pan === pan.toUpperCase() && p.isDefault);
                if (hadDefault) {
                    filteredPans[0].isDefault = true;
                }
            }

            user.verifiedPans = filteredPans;
            await user.save();

            enterpriseLogger.info('PAN removed from user profile', {
                userId: user.id,
                pan: pan.toUpperCase(),
            });

            return user;

        } catch (error) {
            enterpriseLogger.error('Remove verified PAN error', {
                userId: userPayload?.id,
                pan,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Update PAN label
     * @param {Object} user - User instance
     * @param {string} pan - PAN number
     * @param {string} newLabel - New label
     * @returns {Promise<Object>} Updated user
     */
    static async updatePANLabel(userPayload, pan, newLabel) {
        try {
            // Fetch actual User model instance from database
            const user = await User.findByPk(userPayload.userId);
            if (!user) {
                throw new Error('User not found');
            }

            const verifiedPans = user.verifiedPans || [];
            const panIndex = verifiedPans.findIndex(p => p.pan === pan.toUpperCase());

            if (panIndex === -1) {
                throw new Error('PAN not found');
            }

            verifiedPans[panIndex].label = newLabel;
            user.verifiedPans = verifiedPans;
            await user.save();

            enterpriseLogger.info('PAN label updated', {
                userId: user.id,
                pan: pan.toUpperCase(),
                newLabel,
            });

            return user;

        } catch (error) {
            enterpriseLogger.error('Update PAN label error', {
                userId: userPayload?.id,
                pan,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Set default PAN
     * @param {Object} user - User instance
     * @param {string} pan - PAN number to set as default
     * @returns {Promise<Object>} Updated user
     */
    static async setDefaultPAN(userPayload, pan) {
        try {
            // Fetch actual User model instance from database
            const user = await User.findByPk(userPayload.userId);
            if (!user) {
                throw new Error('User not found');
            }

            const verifiedPans = user.verifiedPans || [];

            // Remove default from all PANs
            verifiedPans.forEach(p => {
                p.isDefault = p.pan === pan.toUpperCase();
            });

            user.verifiedPans = verifiedPans;
            await user.save();

            enterpriseLogger.info('Default PAN updated', {
                userId: user.id,
                pan: pan.toUpperCase(),
            });

            return user;

        } catch (error) {
            enterpriseLogger.error('Set default PAN error', {
                userId: userPayload?.id,
                pan,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get default PAN for user
     * @param {Object} user - User instance
     * @returns {Object|null} Default PAN object or null
     */
    static getDefaultPAN(user) {
        const verifiedPans = user.verifiedPans || [];
        return verifiedPans.find(p => p.isDefault) || verifiedPans[0] || null;
    }
}

module.exports = PANVerificationService;
