/**
 * Consent Service
 * Manages user consents for DPDP Act compliance
 */

const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const Consent = require('../../models/Consent');
const enterpriseLogger = require('../../utils/logger');
const crypto = require('crypto');

class ConsentService {

    /**
     * Grant a new consent
     * @param {string} userId - User ID giving consent
     * @param {Object} consentData - Consent details
     * @returns {Object} Created consent
     */
    async grantConsent(userId, consentData) {
        const {
            scope,
            level = 'global',
            fieldPath = null,
            returnVersionId = null,
            metadata = {},
            expiresAt = null
        } = consentData;

        const transaction = await sequelize.transaction();

        try {
            // Check for existing active consent to handle versioning
            const existingConsent = await Consent.findOne({
                where: {
                    givenBy: userId,
                    scope,
                    level,
                    fieldPath,
                    returnVersionId,
                    status: 'given'
                },
                order: [['version', 'DESC']],
                transaction
            });

            // If effective consent exists and is same, maybe no-op? 
            // But usually we record re-consent as new version or just audit log.
            // Let's create new version linked to previous logic if we stick to one active chain.
            // Or if existing is exactly same, maybe just update timestamp? 
            // DPDP says every consent is an event.

            let nextVersion = 1;
            let previousVersionId = null;
            let consentId = crypto.randomUUID(); // New ID by default

            if (existingConsent) {
                // We are updating/renewing an existing consent stream
                nextVersion = existingConsent.version + 1;
                previousVersionId = existingConsent.id;
                consentId = existingConsent.consentId; // Keep same logical ID

                // Mark previous as expired/superseded if we want strictly one active?
                // Or just rely on "latest version" logic.
                // For audit, we keep history.
            }

            const newConsent = await Consent.create({
                consentId,
                returnVersionId,
                scope,
                level,
                fieldPath,
                version: nextVersion,
                givenBy: userId,
                status: 'given',
                expiresAt,
                metadata,
                previousVersionId
            }, { transaction });

            await transaction.commit();

            enterpriseLogger.info('Consent granted', {
                userId,
                scope,
                consentId: newConsent.consentId,
                version: newConsent.version
            });

            return newConsent;

        } catch (error) {
            await transaction.rollback();
            enterpriseLogger.error('Grant consent failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Revoke a consent
     * @param {string} consentId - Logical Consent ID (or UUID of record?)
     * @param {string} userId - User revoking
     * @returns {boolean} Success
     */
    async revokeConsent(consentId, userId) {
        // We revoke all active versions for this logical consentId? 
        // Or specific record? Model has `consentId` as common identifier.
        // Usually revoke means "stop processing", so logical ID.

        const transaction = await sequelize.transaction();
        try {
            // Find all active consents with this logical ID
            const activeConsents = await Consent.findAll({
                where: {
                    consentId: consentId,
                    status: 'given',
                    givenBy: userId // Security check
                },
                transaction
            });

            if (!activeConsents.length) {
                await transaction.rollback();
                return false; // Already revoked or not found
            }

            // Update all to revoked
            await Consent.update({
                status: 'revoked',
                revokedAt: new Date(),
                revokedBy: userId
            }, {
                where: {
                    consentId: consentId,
                    status: 'given',
                    givenBy: userId
                },
                transaction
            });

            await transaction.commit();
            enterpriseLogger.info('Consent revoked', { userId, consentId });
            return true;
        } catch (error) {
            await transaction.rollback();
            enterpriseLogger.error('Revoke consent failed', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Check if user has active consent
     */
    async hasConsent(userId, scope, level = 'global', fieldPath = null, returnVersionId = null) {
        const where = {
            givenBy: userId,
            scope,
            level,
            status: 'given'
        };

        if (fieldPath) where.fieldPath = fieldPath;
        if (returnVersionId) where.returnVersionId = returnVersionId;

        // Check expiry
        where[Op.or] = [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
        ];

        const consent = await Consent.findOne({ where });
        return !!consent;
    }

    /**
     * Get consent history/active consents
     */
    async getUserConsents(userId, status = 'given') {
        const where = { givenBy: userId };
        if (status) where.status = status;

        return await Consent.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
    }
}

module.exports = new ConsentService();
