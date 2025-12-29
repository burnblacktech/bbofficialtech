// =====================================================
// SOURCE TAGGING SERVICE
// Manages field-level source tracking and lineage
// =====================================================

const DataSource = require('../../models/DataSource');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

class SourceTaggingService {
  /**
   * Tag a field with a data source
   * @param {string} returnVersionId - Return version ID
   * @param {string} fieldPath - Field path (e.g., 'income.salary')
   * @param {object} sourceInfo - Source information
   * @param {string} userId - User ID
   * @returns {Promise<object>} Created DataSource record
   */
  async tagField(returnVersionId, fieldPath, sourceInfo, userId) {
    try {
      const {
        sourceType,
        sourceId,
        documentId,
        fieldValue,
        confidence = 1.0,
        metadata = {},
        assessmentYear,
      } = sourceInfo;

      if (!sourceType || !fieldPath) {
        throw new AppError('sourceType and fieldPath are required', 400);
      }

      // Check if source already exists for this field
      const existingSource = await DataSource.findOne({
        where: {
          returnVersionId,
          fieldPath,
          sourceType,
          sourceId: sourceId || null,
        },
      });

      if (existingSource) {
        // Update existing source
        await existingSource.update({
          fieldValue,
          confidence,
          metadata,
          documentId,
        });

        enterpriseLogger.info('Data source updated', {
          returnVersionId,
          fieldPath,
          sourceType,
        });

        return existingSource;
      }

      // Create new source
      const dataSource = await DataSource.create({
        returnVersionId,
        sourceType,
        sourceId,
        documentId,
        assessmentYear: assessmentYear || '2024-25',
        fieldPath,
        fieldValue,
        confidence,
        metadata,
        createdBy: userId,
      });

      enterpriseLogger.info('Data source tagged', {
        returnVersionId,
        fieldPath,
        sourceType,
        sourceId: dataSource.id,
      });

      return dataSource;
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('Failed to tag field source', {
        returnVersionId,
        fieldPath,
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(`Failed to tag source: ${error.message}`, 500);
    }
  }

  /**
   * Get sources for a field
   * @param {string} returnVersionId - Return version ID
   * @param {string} fieldPath - Field path
   * @returns {Promise<array>} Array of DataSource records
   */
  async getFieldSources(returnVersionId, fieldPath) {
    try {
      const sources = await DataSource.findAll({
        where: {
          returnVersionId,
          fieldPath,
        },
        order: [['confidence', 'DESC'], ['createdAt', 'DESC']],
      });

      return sources;
    } catch (error) {
      enterpriseLogger.error('Failed to get field sources', {
        returnVersionId,
        fieldPath,
        error: error.message,
      });
      throw new AppError(`Failed to get sources: ${error.message}`, 500);
    }
  }

  /**
   * Get all sources for a return version
   * @param {string} returnVersionId - Return version ID
   * @returns {Promise<object>} Sources grouped by field path
   */
  async getVersionSources(returnVersionId) {
    try {
      const sources = await DataSource.findAll({
        where: { returnVersionId },
        order: [['fieldPath', 'ASC'], ['confidence', 'DESC']],
      });

      // Group by field path
      const grouped = {};
      sources.forEach(source => {
        if (!grouped[source.fieldPath]) {
          grouped[source.fieldPath] = [];
        }
        grouped[source.fieldPath].push(source);
      });

      return grouped;
    } catch (error) {
      enterpriseLogger.error('Failed to get version sources', {
        returnVersionId,
        error: error.message,
      });
      throw new AppError(`Failed to get version sources: ${error.message}`, 500);
    }
  }

  /**
   * Verify a data source
   * @param {string} sourceId - DataSource ID
   * @param {string} userId - User ID verifying
   * @returns {Promise<object>} Updated DataSource
   */
  async verifySource(sourceId, userId) {
    try {
      const source = await DataSource.findByPk(sourceId);
      if (!source) {
        throw new AppError('Data source not found', 404);
      }

      await source.update({
        isVerified: true,
        verifiedBy: userId,
        verifiedAt: new Date(),
      });

      enterpriseLogger.info('Data source verified', {
        sourceId,
        userId,
      });

      return source;
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('Failed to verify source', {
        sourceId,
        userId,
        error: error.message,
      });
      throw new AppError(`Failed to verify source: ${error.message}`, 500);
    }
  }

  /**
   * Get source lineage for a field (track changes over versions)
   * @param {string} returnId - Return ID
   * @param {string} fieldPath - Field path
   * @returns {Promise<array>} Array of sources across versions
   */
  async getSourceLineage(returnId, fieldPath) {
    try {
      const ReturnVersion = require('../../models/ReturnVersion');
      const versions = await ReturnVersion.findAll({
        where: { returnId },
        order: [['versionNumber', 'ASC']],
      });

      const lineage = [];
      for (const version of versions) {
        const sources = await this.getFieldSources(version.id, fieldPath);
        if (sources.length > 0) {
          lineage.push({
            version: version.versionNumber,
            versionId: version.id,
            createdAt: version.createdAt,
            sources,
          });
        }
      }

      return lineage;
    } catch (error) {
      enterpriseLogger.error('Failed to get source lineage', {
        returnId,
        fieldPath,
        error: error.message,
      });
      throw new AppError(`Failed to get source lineage: ${error.message}`, 500);
    }
  }

  /**
   * Resolve conflicts between multiple sources for the same field
   * @param {array} sources - Array of DataSource records
   * @returns {object} Resolved source (highest confidence, verified sources preferred)
   */
  resolveSourceConflict(sources) {
    if (!sources || sources.length === 0) {
      return null;
    }

    if (sources.length === 1) {
      return sources[0];
    }

    // Sort by: verified first, then confidence, then creation date
    const sorted = [...sources].sort((a, b) => {
      // Verified sources first
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      // Higher confidence first
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      // Newer first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return sorted[0];
  }
}

module.exports = SourceTaggingService;

