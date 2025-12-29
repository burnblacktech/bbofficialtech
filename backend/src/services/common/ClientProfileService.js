// =====================================================
// CLIENT PROFILE SERVICE
// Manages client onboarding, assignments, and access control
// Multi-tenant B2B client management
// =====================================================

const { FamilyMember, Assignment, User, CAFirm } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

class ClientProfileService {
  /**
   * Onboard a new client for a CA firm
   * @param {string} firmId - CA firm ID
   * @param {Object} clientData - Client information
   * @param {string} createdBy - User ID who created the client
   * @returns {Promise<Object>} Created client
   */
  async onboardClient(firmId, clientData, createdBy) {
    try {
      enterpriseLogger.info('Onboarding client', { firmId, createdBy });

      // Verify firm exists
      const firm = await CAFirm.findByPk(firmId);
      if (!firm) {
        throw new AppError('CA firm not found', 404);
      }

      // Create client profile (using Member model with clientType='ca_client')
      const client = await FamilyMember.create({
        userId: createdBy, // Firm admin who created
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        panNumber: clientData.panNumber,
        dateOfBirth: clientData.dateOfBirth,
        relationship: 'other', // Default for CA clients
        gender: clientData.gender || 'other',
        maritalStatus: clientData.maritalStatus || 'single',
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address,
        firmId,
        clientType: 'ca_client',
        status: 'active',
        assignedTo: {},
      });

      enterpriseLogger.info('Client onboarded successfully', {
        clientId: client.id,
        firmId,
        panNumber: client.panNumber,
      });

      return client;
    } catch (error) {
      enterpriseLogger.error('Onboard client error', {
        firmId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Assign a client to a preparer/reviewer
   * @param {string} clientId - Client (Member) ID
   * @param {string} userId - User ID (preparer/reviewer)
   * @param {string} role - Assignment role ('preparer', 'reviewer', 'admin')
   * @param {string} createdBy - User ID who created the assignment
   * @param {Object} options - Additional options (activeFrom, activeTo, metadata)
   * @returns {Promise<Object>} Created assignment
   */
  async assignClient(clientId, userId, role, createdBy, options = {}) {
    try {
      enterpriseLogger.info('Assigning client', { clientId, userId, role, createdBy });

      // Validate role
      const validRoles = ['preparer', 'reviewer', 'admin'];
      if (!validRoles.includes(role)) {
        throw new AppError(`Invalid assignment role: ${role}`, 400);
      }

      // Verify client exists and is a CA client
      const client = await FamilyMember.findByPk(clientId);
      if (!client) {
        throw new AppError('Client not found', 404);
      }
      if (client.clientType !== 'ca_client') {
        throw new AppError('Assignment only available for CA clients', 400);
      }

      // Verify user exists and has appropriate role
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      if (!['CA', 'PREPARER', 'REVIEWER', 'CA_FIRM_ADMIN'].includes(user.role)) {
        throw new AppError('User role not eligible for assignment', 400);
      }

      // Verify user belongs to same firm as client
      if (user.caFirmId !== client.firmId) {
        throw new AppError('User and client must belong to same firm', 403);
      }

      // Check for existing active assignment
      const existing = await Assignment.findByClientAndUser(clientId, userId, role);
      if (existing && existing.isActive()) {
        throw new AppError('Active assignment already exists', 409);
      }

      // Create assignment
      const assignment = await Assignment.create({
        clientId,
        userId,
        role,
        activeFrom: options.activeFrom || new Date(),
        activeTo: options.activeTo || null,
        status: 'active',
        createdBy,
        metadata: options.metadata || {},
      });

      // Update client's assignedTo field for quick lookup
      const assignedTo = client.assignedTo || {};
      if (!assignedTo[role]) {
        assignedTo[role] = [];
      }
      assignedTo[role].push({
        userId,
        assignmentId: assignment.id,
        assignedAt: assignment.activeFrom,
      });

      await client.update({ assignedTo });

      enterpriseLogger.info('Client assigned successfully', {
        assignmentId: assignment.id,
        clientId,
        userId,
        role,
      });

      return assignment;
    } catch (error) {
      enterpriseLogger.error('Assign client error', {
        clientId,
        userId,
        role,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all assignments for a client
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} Array of assignments
   */
  async getClientAssignments(clientId) {
    try {
      return await Assignment.findActiveByClient(clientId);
    } catch (error) {
      enterpriseLogger.error('Get client assignments error', {
        clientId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all clients assigned to a user
   * @param {string} userId - User ID
   * @param {string} role - Optional role filter
   * @returns {Promise<Array>} Array of assignments with clients
   */
  async getUserAssignments(userId, role = null) {
    try {
      const assignments = await Assignment.findActiveByUser(userId, role);
      
      // Load client details
      const assignmentsWithClients = await Promise.all(
        assignments.map(async (assignment) => {
          const client = await FamilyMember.findByPk(assignment.clientId);
          return {
            assignment,
            client,
          };
        })
      );

      return assignmentsWithClients;
    } catch (error) {
      enterpriseLogger.error('Get user assignments error', {
        userId,
        role,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Revoke an assignment
   * @param {string} assignmentId - Assignment ID
   * @param {string} revokedBy - User ID who revoked
   * @param {string} reason - Reason for revocation
   * @returns {Promise<Object>} Updated assignment
   */
  async revokeAssignment(assignmentId, revokedBy, reason = null) {
    try {
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      await assignment.revoke(revokedBy, reason);

      // Update client's assignedTo field
      const client = await FamilyMember.findByPk(assignment.clientId);
      if (client && client.assignedTo) {
        const assignedTo = { ...client.assignedTo };
        if (assignedTo[assignment.role]) {
          assignedTo[assignment.role] = assignedTo[assignment.role].filter(
            a => a.assignmentId !== assignmentId
          );
        }
        await client.update({ assignedTo });
      }

      enterpriseLogger.info('Assignment revoked', {
        assignmentId,
        revokedBy,
        reason,
      });

      return assignment;
    } catch (error) {
      enterpriseLogger.error('Revoke assignment error', {
        assignmentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user can access a client
   * @param {string} userId - User ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Access check result
   */
  async canUserAccessClient(userId, clientId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return { allowed: false, reason: 'user_not_found' };
      }

      // Use User model's canAccessClient method
      return await user.canAccessClient(clientId);
    } catch (error) {
      enterpriseLogger.error('Check client access error', {
        userId,
        clientId,
        error: error.message,
      });
      return { allowed: false, reason: 'error' };
    }
  }

  /**
   * Get client list for a firm with filters
   * @param {string} firmId - Firm ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of clients
   */
  async getClientList(firmId, filters = {}) {
    try {
      const whereClause = {
        firmId,
        clientType: 'ca_client',
      };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const clients = await FamilyMember.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      });

      // Load assignments for each client
      const clientsWithAssignments = await Promise.all(
        clients.map(async (client) => {
          const assignments = await this.getClientAssignments(client.id);
          return {
            client,
            assignments,
          };
        })
      );

      return clientsWithAssignments;
    } catch (error) {
      enterpriseLogger.error('Get client list error', {
        firmId,
        filters,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new ClientProfileService();

