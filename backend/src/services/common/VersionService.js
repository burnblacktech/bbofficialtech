// =====================================================
// VERSION SERVICE
// Manages return versioning, comparison, and revert
// =====================================================

const ReturnVersion = require('../../models/ReturnVersion');
const ITRFiling = require('../../models/ITRFiling');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class VersionService {
  /**
   * Create a new version of a return
   * @param {string} returnId - Return ID
   * @param {object} formData - Form data snapshot
   * @param {object} taxComputation - Tax computation result
   * @param {string} userId - User ID creating the version
   * @param {string} regime - Tax regime ('old' or 'new')
   * @param {string} assessmentYear - Assessment year
   * @param {string} changeSummary - Optional change summary
   * @returns {Promise<object>} Created version
   */
  async createVersion(returnId, formData, taxComputation, userId, regime, assessmentYear, changeSummary = null) {
    try {
      // Get current version number
      const currentVersion = await ReturnVersion.findOne({
        where: { returnId, isCurrent: true },
        order: [['versionNumber', 'DESC']],
      });

      const nextVersionNumber = currentVersion
        ? currentVersion.versionNumber + 1
        : 1;

      // Mark previous version as not current
      if (currentVersion) {
        await currentVersion.update({ isCurrent: false });
      }

      // Create new version
      const newVersion = await ReturnVersion.create({
        returnId,
        versionNumber: nextVersionNumber,
        dataSnapshot: formData,
        taxComputation,
        regime,
        assessmentYear,
        createdBy: userId,
        changeSummary: changeSummary || `Version ${nextVersionNumber}`,
        isCurrent: true,
      });

      enterpriseLogger.info('Return version created', {
        returnId,
        versionNumber: nextVersionNumber,
        userId,
      });

      return newVersion;
    } catch (error) {
      enterpriseLogger.error('Failed to create return version', {
        returnId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(`Failed to create version: ${error.message}`, 500);
    }
  }

  /**
   * Get all versions for a return
   * @param {string} returnId - Return ID
   * @returns {Promise<array>} Array of versions
   */
  async getVersions(returnId) {
    try {
      const versions = await ReturnVersion.findAll({
        where: { returnId },
        order: [['versionNumber', 'DESC']],
        include: [
          {
            model: require('../../models/User'),
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      return versions;
    } catch (error) {
      enterpriseLogger.error('Failed to get return versions', {
        returnId,
        error: error.message,
      });
      throw new AppError(`Failed to get versions: ${error.message}`, 500);
    }
  }

  /**
   * Get specific version
   * @param {string} versionId - Version ID
   * @returns {Promise<object>} Version object
   */
  async getVersion(versionId) {
    try {
      const version = await ReturnVersion.findByPk(versionId, {
        include: [
          {
            model: require('../../models/User'),
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      if (!version) {
        throw new AppError('Version not found', 404);
      }

      return version;
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('Failed to get version', {
        versionId,
        error: error.message,
      });
      throw new AppError(`Failed to get version: ${error.message}`, 500);
    }
  }

  /**
   * Compare two versions
   * @param {string} versionId1 - First version ID
   * @param {string} versionId2 - Second version ID
   * @returns {Promise<object>} Comparison result
   */
  async compareVersions(versionId1, versionId2) {
    try {
      const [version1, version2] = await Promise.all([
        this.getVersion(versionId1),
        this.getVersion(versionId2),
      ]);

      if (version1.returnId !== version2.returnId) {
        throw new AppError('Cannot compare versions from different returns', 400);
      }

      const changes = this.calculateChanges(
        version1.dataSnapshot,
        version2.dataSnapshot
      );

      return {
        version1: {
          id: version1.id,
          versionNumber: version1.versionNumber,
          createdAt: version1.createdAt,
        },
        version2: {
          id: version2.id,
          versionNumber: version2.versionNumber,
          createdAt: version2.createdAt,
        },
        changes,
        summary: {
          fieldsChanged: changes.length,
          sectionsAffected: this.getAffectedSections(changes),
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('Failed to compare versions', {
        versionId1,
        versionId2,
        error: error.message,
      });
      throw new AppError(`Failed to compare versions: ${error.message}`, 500);
    }
  }

  /**
   * Revert to a specific version
   * @param {string} returnId - Return ID
   * @param {string} versionId - Version ID to revert to
   * @param {string} userId - User ID performing revert
   * @returns {Promise<object>} New version created from revert
   */
  async revertToVersion(returnId, versionId, userId) {
    try {
      const targetVersion = await this.getVersion(versionId);

      if (targetVersion.returnId !== returnId) {
        throw new AppError('Version does not belong to this return', 400);
      }

      // Create new version from target version's data
      const newVersion = await this.createVersion(
        returnId,
        targetVersion.dataSnapshot,
        targetVersion.taxComputation,
        userId,
        targetVersion.regime,
        targetVersion.assessmentYear,
        `Reverted to version ${targetVersion.versionNumber}`
      );

      enterpriseLogger.info('Return reverted to version', {
        returnId,
        targetVersionId: versionId,
        newVersionId: newVersion.id,
        userId,
      });

      return newVersion;
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('Failed to revert to version', {
        returnId,
        versionId,
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to revert: ${error.message}`, 500);
    }
  }

  /**
   * Calculate changes between two data snapshots
   */
  calculateChanges(snapshot1, snapshot2) {
    const changes = [];

    const compareObjects = (obj1, obj2, path = '') => {
      const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
          compareObjects(val1, val2, currentPath);
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changes.push({
            field: currentPath,
            oldValue: val1,
            newValue: val2,
            type: val1 === undefined ? 'added' : val2 === undefined ? 'removed' : 'modified',
          });
        }
      }
    };

    compareObjects(snapshot1, snapshot2);
    return changes;
  }

  /**
   * Get affected sections from changes
   */
  getAffectedSections(changes) {
    const sections = new Set();
    changes.forEach(change => {
      const section = change.field.split('.')[0];
      sections.add(section);
    });
    return Array.from(sections);
  }
}

module.exports = VersionService;

