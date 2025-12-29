// =====================================================
// FOREIGN ASSETS SERVICE
// Service for managing foreign assets (Schedule FA)
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const ForeignAsset = require('../../models/ForeignAsset');
const ITRFiling = require('../../models/ITRFiling');

class ForeignAssetsService {
  /**
   * Get all foreign assets for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<Array>} - Foreign assets
   */
  async getForeignAssets(filingId) {
    try {
      enterpriseLogger.info('Fetching foreign assets', { filingId });

      const assets = await ForeignAsset.findByFiling(filingId);

      return {
        success: true,
        assets: assets.map(asset => this.formatAsset(asset)),
        totalValue: assets.reduce((sum, asset) => sum + parseFloat(asset.valuationAmountInr || 0), 0),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get foreign assets', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to get foreign assets: ${error.message}`, 500);
    }
  }

  /**
   * Add a foreign asset
   * @param {string} filingId - Filing ID
   * @param {string} userId - User ID
   * @param {object} assetData - Asset data
   * @returns {Promise<object>} - Created asset
   */
  async addForeignAsset(filingId, userId, assetData) {
    try {
      enterpriseLogger.info('Adding foreign asset', { filingId, assetType: assetData.assetType });

      // Validate asset data
      await this.validateForeignAsset(assetData);

      // Verify filing exists and user owns it
      const filing = await ITRFiling.findByPk(filingId);
      if (!filing) {
        throw new AppError('Filing not found', 404);
      }

      if (filing.userId !== userId) {
        throw new AppError('Unauthorized access to filing', 403);
      }

      // Calculate valuation in INR if not provided
      let valuationAmountInr = assetData.valuationAmountInr;
      if (!valuationAmountInr && assetData.valuationAmountForeign && assetData.exchangeRate) {
        valuationAmountInr = parseFloat(assetData.valuationAmountForeign) * parseFloat(assetData.exchangeRate);
      }

      // Create foreign asset
      const asset = await ForeignAsset.create({
        filingId,
        userId,
        assetType: assetData.assetType,
        country: assetData.country,
        assetDetails: assetData.assetDetails || {},
        declarationDate: assetData.declarationDate || new Date(),
        valuationDate: assetData.valuationDate || new Date(),
        valuationAmountInr: valuationAmountInr || 0,
        valuationAmountForeign: assetData.valuationAmountForeign,
        currency: assetData.currency,
        exchangeRate: assetData.exchangeRate,
        dtaaApplicable: assetData.dtaaApplicable || false,
        dtaaCountry: assetData.dtaaCountry,
        supportingDocuments: assetData.supportingDocuments || [],
      });

      enterpriseLogger.info('Foreign asset added successfully', {
        assetId: asset.id,
        filingId,
        assetType: asset.assetType,
      });

      return {
        success: true,
        asset: this.formatAsset(asset),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to add foreign asset', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to add foreign asset: ${error.message}`, error.statusCode || 500);
    }
  }

  /**
   * Update foreign asset
   * @param {string} assetId - Asset ID
   * @param {string} userId - User ID
   * @param {object} assetData - Updated asset data
   * @returns {Promise<object>} - Updated asset
   */
  async updateForeignAsset(assetId, userId, assetData) {
    try {
      enterpriseLogger.info('Updating foreign asset', { assetId });

      const asset = await ForeignAsset.findByPk(assetId);
      if (!asset) {
        throw new AppError('Foreign asset not found', 404);
      }

      if (asset.userId !== userId) {
        throw new AppError('Unauthorized access to asset', 403);
      }

      // Validate asset data if provided
      if (assetData.assetType || assetData.country || assetData.assetDetails) {
        await this.validateForeignAsset({ ...asset.toJSON(), ...assetData });
      }

      // Calculate valuation in INR if needed
      let valuationAmountInr = assetData.valuationAmountInr;
      if (!valuationAmountInr && assetData.valuationAmountForeign && assetData.exchangeRate) {
        valuationAmountInr = parseFloat(assetData.valuationAmountForeign) * parseFloat(assetData.exchangeRate);
      }

      // Update asset
      const updateData = {};
      if (assetData.assetType) updateData.assetType = assetData.assetType;
      if (assetData.country) updateData.country = assetData.country;
      if (assetData.assetDetails) updateData.assetDetails = assetData.assetDetails;
      if (assetData.declarationDate) updateData.declarationDate = assetData.declarationDate;
      if (assetData.valuationDate) updateData.valuationDate = assetData.valuationDate;
      if (valuationAmountInr !== undefined) updateData.valuationAmountInr = valuationAmountInr;
      if (assetData.valuationAmountForeign !== undefined) updateData.valuationAmountForeign = assetData.valuationAmountForeign;
      if (assetData.currency !== undefined) updateData.currency = assetData.currency;
      if (assetData.exchangeRate !== undefined) updateData.exchangeRate = assetData.exchangeRate;
      if (assetData.dtaaApplicable !== undefined) updateData.dtaaApplicable = assetData.dtaaApplicable;
      if (assetData.dtaaCountry !== undefined) updateData.dtaaCountry = assetData.dtaaCountry;
      if (assetData.supportingDocuments !== undefined) updateData.supportingDocuments = assetData.supportingDocuments;

      await asset.update(updateData);

      enterpriseLogger.info('Foreign asset updated successfully', {
        assetId: asset.id,
        filingId: asset.filingId,
      });

      return {
        success: true,
        asset: this.formatAsset(asset),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to update foreign asset', {
        assetId,
        error: error.message,
      });
      throw new AppError(`Failed to update foreign asset: ${error.message}`, error.statusCode || 500);
    }
  }

  /**
   * Delete foreign asset
   * @param {string} assetId - Asset ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Deletion result
   */
  async deleteForeignAsset(assetId, userId) {
    try {
      enterpriseLogger.info('Deleting foreign asset', { assetId });

      const asset = await ForeignAsset.findByPk(assetId);
      if (!asset) {
        throw new AppError('Foreign asset not found', 404);
      }

      if (asset.userId !== userId) {
        throw new AppError('Unauthorized access to asset', 403);
      }

      await asset.destroy();

      enterpriseLogger.info('Foreign asset deleted successfully', {
        assetId,
        filingId: asset.filingId,
      });

      return {
        success: true,
        message: 'Foreign asset deleted successfully',
      };
    } catch (error) {
      enterpriseLogger.error('Failed to delete foreign asset', {
        assetId,
        error: error.message,
      });
      throw new AppError(`Failed to delete foreign asset: ${error.message}`, error.statusCode || 500);
    }
  }

  /**
   * Validate foreign asset data
   * @param {object} assetData - Asset data to validate
   * @returns {Promise<void>}
   */
  async validateForeignAsset(assetData) {
    // Validate asset type
    const validAssetTypes = ['bank_account', 'equity_holding', 'immovable_property', 'other'];
    if (!assetData.assetType || !validAssetTypes.includes(assetData.assetType)) {
      throw new AppError('Invalid asset type', 400);
    }

    // Validate country
    if (!assetData.country || assetData.country.trim() === '') {
      throw new AppError('Country is required', 400);
    }

    // Validate asset details based on type
    if (!assetData.assetDetails || typeof assetData.assetDetails !== 'object') {
      throw new AppError('Asset details are required', 400);
    }

    // Type-specific validation
    if (assetData.assetType === 'bank_account') {
      if (!assetData.assetDetails.bankName) {
        throw new AppError('Bank name is required for bank account', 400);
      }
      if (!assetData.assetDetails.accountNumber) {
        throw new AppError('Account number is required for bank account', 400);
      }
    } else if (assetData.assetType === 'equity_holding') {
      if (!assetData.assetDetails.companyName) {
        throw new AppError('Company name is required for equity holding', 400);
      }
      if (!assetData.assetDetails.numberOfShares || parseFloat(assetData.assetDetails.numberOfShares) <= 0) {
        throw new AppError('Number of shares must be greater than 0', 400);
      }
    } else if (assetData.assetType === 'immovable_property') {
      if (!assetData.assetDetails.address) {
        throw new AppError('Property address is required', 400);
      }
      if (!assetData.assetDetails.propertyType) {
        throw new AppError('Property type is required', 400);
      }
    }

    // Validate valuation
    if (!assetData.valuationAmountInr && (!assetData.valuationAmountForeign || !assetData.exchangeRate)) {
      throw new AppError('Valuation amount in INR or foreign amount with exchange rate is required', 400);
    }

    // Validate exchange rate if foreign currency is provided
    if (assetData.valuationAmountForeign && (!assetData.exchangeRate || parseFloat(assetData.exchangeRate) <= 0)) {
      throw new AppError('Valid exchange rate is required when foreign currency amount is provided', 400);
    }

    // Validate DTAA
    if (assetData.dtaaApplicable && !assetData.dtaaCountry) {
      throw new AppError('DTAA country is required when DTAA is applicable', 400);
    }
  }

  /**
   * Calculate total foreign assets value
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - Total value breakdown
   */
  async calculateTotalForeignAssets(filingId) {
    try {
      const assets = await ForeignAsset.findByFiling(filingId);

      const breakdown = {
        byType: {},
        byCountry: {},
        totalValue: 0,
        dtaaAssets: 0,
      };

      assets.forEach(asset => {
        const value = parseFloat(asset.valuationAmountInr || 0);
        breakdown.totalValue += value;

        // Breakdown by type
        if (!breakdown.byType[asset.assetType]) {
          breakdown.byType[asset.assetType] = 0;
        }
        breakdown.byType[asset.assetType] += value;

        // Breakdown by country
        if (!breakdown.byCountry[asset.country]) {
          breakdown.byCountry[asset.country] = 0;
        }
        breakdown.byCountry[asset.country] += value;

        // DTAA assets
        if (asset.dtaaApplicable) {
          breakdown.dtaaAssets += value;
        }
      });

      return {
        success: true,
        ...breakdown,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to calculate total foreign assets', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to calculate total foreign assets: ${error.message}`, 500);
    }
  }

  /**
   * Generate Schedule FA for ITR submission
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - Schedule FA data
   */
  async generateScheduleFA(filingId) {
    try {
      enterpriseLogger.info('Generating Schedule FA', { filingId });

      const assets = await ForeignAsset.findByFiling(filingId);
      const totals = await this.calculateTotalForeignAssets(filingId);

      // Group assets by type
      const scheduleFA = {
        bankAccounts: assets.filter(a => a.assetType === 'bank_account').map(a => this.formatAssetForSchedule(a)),
        equityHoldings: assets.filter(a => a.assetType === 'equity_holding').map(a => this.formatAssetForSchedule(a)),
        immovableProperties: assets.filter(a => a.assetType === 'immovable_property').map(a => this.formatAssetForSchedule(a)),
        otherAssets: assets.filter(a => a.assetType === 'other').map(a => this.formatAssetForSchedule(a)),
        totals: {
          totalValue: totals.totalValue,
          byType: totals.byType,
          byCountry: totals.byCountry,
          dtaaAssets: totals.dtaaAssets,
        },
      };

      return {
        success: true,
        scheduleFA,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to generate Schedule FA', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to generate Schedule FA: ${error.message}`, 500);
    }
  }

  // Helper methods

  formatAsset(asset) {
    return {
      id: asset.id,
      filingId: asset.filingId,
      userId: asset.userId,
      assetType: asset.assetType,
      country: asset.country,
      assetDetails: asset.assetDetails,
      declarationDate: asset.declarationDate,
      valuationDate: asset.valuationDate,
      valuationAmountInr: asset.valuationAmountInr,
      valuationAmountForeign: asset.valuationAmountForeign,
      currency: asset.currency,
      exchangeRate: asset.exchangeRate,
      dtaaApplicable: asset.dtaaApplicable,
      dtaaCountry: asset.dtaaCountry,
      supportingDocuments: asset.supportingDocuments || [],
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  formatAssetForSchedule(asset) {
    return {
      country: asset.country,
      assetDetails: asset.assetDetails,
      valuationAmountInr: asset.valuationAmountInr,
      valuationAmountForeign: asset.valuationAmountForeign,
      currency: asset.currency,
      exchangeRate: asset.exchangeRate,
      dtaaApplicable: asset.dtaaApplicable,
      dtaaCountry: asset.dtaaCountry,
    };
  }
}

module.exports = new ForeignAssetsService();

