// =====================================================
// FIRM USER SERVICE
// Manages firm-level user operations (add/remove staff)
// =====================================================

const { User, CAFirm } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class FirmUserService {
    /**
     * Add a user to a CA firm
     * @param {string} firmId - Firm ID
     * @param {object} userData - User data (email, fullName, role)
     * @param {string} actorId - ID of user performing action
     * @returns {Promise<User>}
     */
    async addUserToFirm(firmId, userData, actorId) {
        try {
            // Validate actor is CA or CA_FIRM_ADMIN
            const actor = await User.findByPk(actorId);
            if (!actor) {
                throw new AppError('Actor not found', 404);
            }

            if (!['CA', 'CA_FIRM_ADMIN'].includes(actor.role)) {
                throw new AppError('Only CA or Firm Admin can add users', 403);
            }

            // Verify firm exists and actor belongs to it
            const firm = await CAFirm.findByPk(firmId);
            if (!firm) {
                throw new AppError('Firm not found', 404);
            }

            if (actor.caFirmId !== firmId) {
                throw new AppError('You can only add users to your own firm', 403);
            }

            // Validate role (only CA and PREPARER allowed for firm staff)
            const allowedRoles = ['CA', 'PREPARER'];
            if (!allowedRoles.includes(userData.role)) {
                throw new AppError(`Invalid role. Allowed: ${allowedRoles.join(', ')}`, 400);
            }

            // Check if user already exists
            let user = await User.findByEmail(userData.email);

            if (user) {
                // User exists - update to add to firm
                if (user.caFirmId && user.caFirmId !== firmId) {
                    throw new AppError('User already belongs to another firm', 409);
                }

                user.caFirmId = firmId;
                user.role = userData.role;
                user.fullName = userData.fullName || user.fullName;
                await user.save();

                enterpriseLogger.info('User added to firm (existing user)', {
                    userId: user.id,
                    firmId,
                    role: userData.role,
                    actorId,
                });
            } else {
                // Create new user
                user = await User.create({
                    email: userData.email.toLowerCase(),
                    fullName: userData.fullName,
                    role: userData.role,
                    caFirmId: firmId,
                    status: 'active',
                    authProvider: 'LOCAL',
                    // Password will be set via email invite flow (future)
                    passwordHash: null,
                });

                enterpriseLogger.info('New user created and added to firm', {
                    userId: user.id,
                    firmId,
                    role: userData.role,
                    actorId,
                });
            }

            return user;
        } catch (error) {
            enterpriseLogger.error('Add user to firm failed', {
                firmId,
                userData,
                actorId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * List all users in a firm
     * @param {string} firmId - Firm ID
     * @param {string} actorId - ID of user performing action
     * @returns {Promise<User[]>}
     */
    async listFirmUsers(firmId, actorId) {
        try {
            // Validate actor belongs to firm
            const actor = await User.findByPk(actorId);
            if (!actor) {
                throw new AppError('Actor not found', 404);
            }

            if (actor.caFirmId !== firmId && !['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(actor.role)) {
                throw new AppError('You can only list users from your own firm', 403);
            }

            const users = await User.findAll({
                where: {
                    caFirmId: firmId,
                    status: 'active',
                },
                attributes: ['id', 'email', 'fullName', 'role', 'status', 'createdAt', 'lastLoginAt'],
                order: [['createdAt', 'DESC']],
            });

            enterpriseLogger.info('Firm users listed', {
                firmId,
                count: users.length,
                actorId,
            });

            return users;
        } catch (error) {
            enterpriseLogger.error('List firm users failed', {
                firmId,
                actorId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Update user role within firm
     * @param {string} firmId - Firm ID
     * @param {string} userId - User ID to update
     * @param {string} newRole - New role
     * @param {string} actorId - ID of user performing action
     * @returns {Promise<User>}
     */
    async updateUserRole(firmId, userId, newRole, actorId) {
        try {
            // Validate actor is CA or CA_FIRM_ADMIN
            const actor = await User.findByPk(actorId);
            if (!actor) {
                throw new AppError('Actor not found', 404);
            }

            if (!['CA', 'CA_FIRM_ADMIN'].includes(actor.role)) {
                throw new AppError('Only CA or Firm Admin can update user roles', 403);
            }

            if (actor.caFirmId !== firmId) {
                throw new AppError('You can only update users in your own firm', 403);
            }

            // Validate new role
            const allowedRoles = ['CA', 'PREPARER'];
            if (!allowedRoles.includes(newRole)) {
                throw new AppError(`Invalid role. Allowed: ${allowedRoles.join(', ')}`, 400);
            }

            // Get user and verify they belong to firm
            const user = await User.findByPk(userId);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            if (user.caFirmId !== firmId) {
                throw new AppError('User does not belong to this firm', 403);
            }

            // Update role
            user.role = newRole;
            await user.save();

            enterpriseLogger.info('User role updated', {
                userId,
                firmId,
                newRole,
                actorId,
            });

            return user;
        } catch (error) {
            enterpriseLogger.error('Update user role failed', {
                firmId,
                userId,
                newRole,
                actorId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Remove user from firm (soft delete - set caFirmId to null)
     * @param {string} firmId - Firm ID
     * @param {string} userId - User ID to remove
     * @param {string} actorId - ID of user performing action
     * @returns {Promise<void>}
     */
    async removeUserFromFirm(firmId, userId, actorId) {
        try {
            // Validate actor is CA or CA_FIRM_ADMIN
            const actor = await User.findByPk(actorId);
            if (!actor) {
                throw new AppError('Actor not found', 404);
            }

            if (!['CA', 'CA_FIRM_ADMIN'].includes(actor.role)) {
                throw new AppError('Only CA or Firm Admin can remove users', 403);
            }

            if (actor.caFirmId !== firmId) {
                throw new AppError('You can only remove users from your own firm', 403);
            }

            // Get user and verify they belong to firm
            const user = await User.findByPk(userId);
            if (!user) {
                throw new AppError('User not found', 404);
            }

            if (user.caFirmId !== firmId) {
                throw new AppError('User does not belong to this firm', 403);
            }

            // Cannot remove self
            if (userId === actorId) {
                throw new AppError('Cannot remove yourself from firm', 400);
            }

            // Remove from firm (soft delete)
            user.caFirmId = null;
            user.role = 'END_USER'; // Revert to default role
            await user.save();

            enterpriseLogger.info('User removed from firm', {
                userId,
                firmId,
                actorId,
            });
        } catch (error) {
            enterpriseLogger.error('Remove user from firm failed', {
                firmId,
                userId,
                actorId,
                error: error.message,
            });
            throw error;
        }
    }
}

module.exports = new FirmUserService();
