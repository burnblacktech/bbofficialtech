/**
 * AuditService.js
 * V4.2 - Production Hardening
 * Handles recording of immutable audit events.
 */

const AuditEvent = require('../../models/AuditEvent');
const { sequelize } = require('../../config/database');

class AuditService {

    /**
     * Record an audit event.
     * MUST NOT FAIL (or if it fails, it must block the transaction in critical paths).
     * @param {Object} eventData
     * @param {Object} [transaction] - Optional Sequelize transaction.
     */
    async log(eventData, transaction = null) {
        const {
            entityType,
            entityId,
            action,
            actorId,
            actorRole,
            payload,
            ipAddress
        } = eventData;

        if (!entityType || !entityId || !action) {
            throw new Error('AuditService: Missing required fields (entityType, entityId, action)');
        }

        try {
            await AuditEvent.create({
                entityType,
                entityId,
                action,
                actorId,
                actorRole,
                payload,
                ipAddress,
                timestamp: new Date()
            }, { transaction });

            // In dev mode, verify it wrote
            // console.log(`[Audit] Recorded: ${action} on ${entityType}:${entityId}`);

        } catch (error) {
            console.error('AuditService Critical Failure:', error);
            // If we are in a transaction, this error will propagate and rollback the main action.
            // This is INTENTIONAL. Action cannot proceed if audit fails.
            throw error;
        }
    }

    /**
     * Quick helper for state transitions
     */
    async logTransition(filingId, fromStatus, toStatus, actorId, actorRole, transaction) {
        return this.log({
            entityType: 'ITR_FILING',
            entityId: filingId,
            action: 'STATE_CHANGE',
            actorId,
            actorRole,
            payload: { from: fromStatus, to: toStatus }
        }, transaction);
    }
}

module.exports = new AuditService();
