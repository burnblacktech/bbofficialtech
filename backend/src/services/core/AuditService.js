// =====================================================
// AUDIT SERVICE - CANONICAL
// Writes to audit_events table (canonical schema)
// =====================================================

const { AuditEvent } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class AuditService {
    static async logAuthEvent({ actorId, action, metadata = {} }) {
        return this.logEvent({
            actorId,
            action,
            entityType: 'USER',
            entityId: actorId,
            metadata
        });
    }

    static async logEvent({ actorId, action, entityType, entityId, metadata = {}, actorRole }, transaction = null) {
        try {
            // S13: Structured logging for runtime visibility
            enterpriseLogger.info('AUDIT_EVENT', {
                actorId: actorId || null,
                action,
                entityType,
                entityId,
                metadata,
                actorRole,
                service: 'AuditService',
                timestamp: new Date().toISOString(),
            });

            // Canonical schema mapping: action -> eventType
            return await AuditEvent.create({
                actorId: actorId || null, // NULL for anonymous/system actions
                actorRole: actorRole || (actorId ? 'USER' : 'ANONYMOUS'), // ANONYMOUS instead of SYSTEM
                eventType: action || 'UNKNOWN',   // Canonical field is event_type
                entityType: entityType ? entityType.toUpperCase() : 'SYSTEM',
                entityId: entityId ? String(entityId) : null, // NULL if missing
                metadata,
            }, transaction ? { transaction } : {});
        } catch (error) {
            // Audit failures should not block main operations
            enterpriseLogger.error('Audit event creation failed', {
                actorId,
                action,
                entityType,
                entityId,
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Compatibility helper for legacy admin actions
     */
    static async logAdminAction(adminId, action, targetResource, details = {}, ipAddress = null) {
        return this.logEvent({
            actorId: adminId,
            action: action.toUpperCase(),
            entityType: targetResource,
            metadata: { ...details, ipAddress }
        });
    }

    /**
     * Compatibility helper for legacy data access
     */
    static async logDataAccess(userId, action, dataType, dataId, details = {}, ipAddress = null) {
        return this.logEvent({
            actorId: userId,
            action: action.toUpperCase(),
            entityType: dataType,
            entityId: dataId,
            metadata: { ...details, ipAddress }
        });
    }
}

module.exports = AuditService;
