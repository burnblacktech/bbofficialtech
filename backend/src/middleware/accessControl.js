// =====================================================
// ACCESS CONTROL MIDDLEWARE
// Unified guard for Role-Based & Relationship-Based Access
// =====================================================

const { User, ITRFiling, FamilyMember, ITRDraft } = require('../models');
const enterpriseLogger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * Access Control Middleware Factory
 * @param {string} resourceType - 'filing', 'draft', 'member', 'user'
 * @param {string} action - 'read', 'write', 'delete', 'create'
 * @param {Object} options - { idSource: 'params'|'body'|'query', idKey: 'id' }
 */
const accessControl = (resourceType, action, options = {}) => {
    const { idSource = 'params', idKey = 'id' } = options;

    return async (req, res, next) => {
        try {
            const actor = req.user;
            if (!actor) {
                throw new AppError('Authentication required', 401);
            }

            // 1. Resolve Resource ID
            let resourceId = null;
            if (idSource === 'params') resourceId = req.params[idKey];
            else if (idSource === 'body') resourceId = req.body[idKey];
            else if (idSource === 'query') resourceId = req.query[idKey];

            // If no resource ID and logic is 'create', specific handling might be needed
            // But generally accessControl protects *existing* resources or checks rights to act on a target user

            // 2. Resolve Target User ID (The Owner)
            let targetUserId = actor.userId; // Default to self acting on self
            let resource = null;

            if (resourceId) {
                if (resourceType === 'filing') {
                    const filing = await ITRFiling.findByPk(resourceId, { attributes: ['userId', 'firmId'] });
                    if (!filing) throw new AppError('Filing not found', 404);
                    targetUserId = filing.userId;
                    resource = filing;
                } else if (resourceType === 'draft') {
                    // IDs for drafts are usually not used directly in routes, usually draftId
                    const draft = await ITRDraft.findByPk(resourceId, {
                        include: [{ model: ITRFiling, as: 'filing', attributes: ['userId', 'firmId'] }]
                    });
                    if (!draft) throw new AppError('Draft not found', 404);
                    targetUserId = draft.filing.userId;
                    resource = draft;
                } else if (resourceType === 'member') {
                    const member = await FamilyMember.findByPk(resourceId, { attributes: ['userId'] });
                    if (!member) throw new AppError('Member not found', 404);
                    targetUserId = member.userId;
                    resource = member;
                } else if (resourceType === 'user') {
                    // Acting on a user directly
                    targetUserId = resourceId;
                }
            } else if (req.query.userId || req.body.userId) {
                // Explicit target user provided (e.g., creating a member FOR a user)
                // CAUTION: Only allow override if actor has permissions
                // We temporarily assume logic below validates this access
                targetUserId = req.query.userId || req.body.userId;
            }

            // 3. Check Access
            // If target is self, allow (basic check, refined by role later if needed)
            if (targetUserId === actor.userId) {
                req.targetUserId = actor.userId;
                req.resource = resource;
                return next();
            }

            // If target is different, MUST reuse the robust logic in User model
            // We need a hydrated User instance for the Actor to call instance method
            // req.user from JWT might be plain object, let's ensure we have logic

            // We'll instantiate a User instance or use a static helper if available
            // But typically req.user is just { userId, role, ... } from JWT
            // So we fetch the full actor user to get current firm/assignment context
            const fullActor = await User.findByPk(actor.userId);
            if (!fullActor) throw new AppError('Actor user not found', 401);

            const access = await fullActor.canAccessClient(targetUserId);

            if (!access.allowed) {
                enterpriseLogger.warn('Access Control Denied', {
                    actorId: actor.userId,
                    targetUserId,
                    resourceType,
                    resourceId,
                    reason: access.reason
                });
                throw new AppError('Access Denied', 403);
            }

            // 4. Inject Context
            req.targetUserId = targetUserId;
            req.resource = resource;
            req.accessContext = access; // { allowed: true, reason: 'assigned', assignment: ... }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = accessControl;
