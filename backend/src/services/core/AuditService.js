// =====================================================
// AUDIT SERVICE - CANONICAL
// Writes to audit_events table (canonical schema)
// =====================================================

const { AuditEvent } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class AuditService {
    static async logAuthEvent({ actorId, action, metadata = {} }) {
        try {
            // S13: Structured logging for runtime visibility
            enterpriseLogger.info('AUTH_EVENT', {
                actorId,
                action,
                metadata,
                service: 'AuditService',
                timestamp: new Date().toISOString(),
            });

            return await AuditEvent.create({
                actorId,
                action,
                entityType: 'USER',
                entityId: actorId,
                metadata,
            });
        } catch (error) {
            // Audit failures should not block auth operations
            enterpriseLogger.error('Audit event creation failed', {
                actorId,
                action,
                error: error.message,
            });
            return null;
        }
    }
}

module.exports = AuditService;
