// =====================================================
// TAX AUDIT CHECKER
// Checks Section 44AB applicability for tax audit
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const BusinessIncomeCalculator = require('./BusinessIncomeCalculator');
const ProfessionalIncomeCalculator = require('./ProfessionalIncomeCalculator');

class TaxAuditChecker {
  constructor() {
    enterpriseLogger.info('TaxAuditChecker initialized');
    
    // Thresholds for tax audit (Section 44AB)
    this.thresholds = {
      business: {
        turnover: 10000000, // ₹1 crore
        profitPercentage: 8, // 8% of turnover
      },
      profession: {
        receipts: 5000000, // ₹50 lakhs
        profitPercentage: 50, // 50% of receipts
      },
    };
  }

  /**
   * Check if tax audit is applicable for business income
   * @param {object} businessData - Business data with P&L
   * @returns {object} - Audit applicability result
   */
  checkBusinessAuditApplicability(businessData) {
    try {
      if (!businessData || !businessData.pnl) {
        return {
          applicable: false,
          reason: 'No business data provided',
        };
      }

      const turnover = businessData.pnl.grossReceipts || 0;
      const netProfit = BusinessIncomeCalculator.calculateNetBusinessIncome(businessData);
      const profitPercentage = turnover > 0 ? (netProfit / turnover) * 100 : 0;

      const reasons = [];

      // Check turnover threshold
      if (turnover > this.thresholds.business.turnover) {
        reasons.push(`Business turnover (₹${(turnover / 10000000).toFixed(2)} crores) exceeds ₹1 crore threshold`);
      }

      // Check profit threshold (if profit is less than 8% of turnover)
      if (turnover > 0 && profitPercentage < this.thresholds.business.profitPercentage) {
        reasons.push(`Business profit (${profitPercentage.toFixed(2)}%) is less than 8% of turnover`);
      }

      return {
        applicable: reasons.length > 0,
        reasons,
        turnover,
        netProfit,
        profitPercentage,
      };
    } catch (error) {
      enterpriseLogger.error('Error checking business audit applicability', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError('Failed to check business audit applicability', 500);
    }
  }

  /**
   * Check if tax audit is applicable for professional income
   * @param {object} professionData - Professional data with P&L
   * @returns {object} - Audit applicability result
   */
  checkProfessionalAuditApplicability(professionData) {
    try {
      if (!professionData || !professionData.pnl) {
        return {
          applicable: false,
          reason: 'No professional data provided',
        };
      }

      const receipts = professionData.pnl.professionalFees || 0;
      const netIncome = ProfessionalIncomeCalculator.calculateNetProfessionalIncome(professionData);
      const profitPercentage = receipts > 0 ? (netIncome / receipts) * 100 : 0;

      const reasons = [];

      // Check receipts threshold
      if (receipts > this.thresholds.profession.receipts) {
        reasons.push(`Professional receipts (₹${(receipts / 100000).toFixed(2)} lakhs) exceed ₹50 lakhs threshold`);
      }

      // Check profit threshold (if profit is less than 50% of receipts)
      if (receipts > 0 && profitPercentage < this.thresholds.profession.profitPercentage) {
        reasons.push(`Professional profit (${profitPercentage.toFixed(2)}%) is less than 50% of receipts`);
      }

      return {
        applicable: reasons.length > 0,
        reasons,
        receipts,
        netIncome,
        profitPercentage,
      };
    } catch (error) {
      enterpriseLogger.error('Error checking professional audit applicability', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError('Failed to check professional audit applicability', 500);
    }
  }

  /**
   * Check tax audit applicability for all businesses and professions
   * @param {object} filingData - Complete filing data
   * @returns {object} - Overall audit applicability result
   */
  checkAuditApplicability(filingData) {
    try {
      const results = {
        applicable: false,
        reasons: [],
        businessResults: [],
        professionalResults: [],
      };

      // Check business income
      if (filingData.businessIncome?.businesses) {
        filingData.businessIncome.businesses.forEach((business, index) => {
          const result = this.checkBusinessAuditApplicability(business);
          results.businessResults.push({
            businessIndex: index,
            businessName: business.businessName || `Business ${index + 1}`,
            ...result,
          });
          
          if (result.applicable) {
            results.applicable = true;
            results.reasons.push(...result.reasons.map(r => `Business ${index + 1}: ${r}`));
          }
        });
      }

      // Check professional income
      if (filingData.professionalIncome?.professions) {
        filingData.professionalIncome.professions.forEach((profession, index) => {
          const result = this.checkProfessionalAuditApplicability(profession);
          results.professionalResults.push({
            professionIndex: index,
            professionName: profession.professionName || `Profession ${index + 1}`,
            ...result,
          });
          
          if (result.applicable) {
            results.applicable = true;
            results.reasons.push(...result.reasons.map(r => `Profession ${index + 1}: ${r}`));
          }
        });
      }

      return results;
    } catch (error) {
      enterpriseLogger.error('Error checking audit applicability', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError('Failed to check audit applicability', 500);
    }
  }

  /**
   * Validate audit report details if audit is applicable
   * @param {object} auditInfo - Audit information
   * @returns {object} - Validation result
   */
  validateAuditReport(auditInfo) {
    const errors = [];

    if (!auditInfo) {
      errors.push('Audit information is required');
      return { isValid: false, errors };
    }

    if (!auditInfo.isAuditApplicable) {
      return { isValid: true, errors: [] };
    }

    // Validate audit report number
    if (!auditInfo.auditReportNumber || auditInfo.auditReportNumber.trim() === '') {
      errors.push('Audit report number is required');
    }

    // Validate audit report date
    if (!auditInfo.auditReportDate) {
      errors.push('Audit report date is required');
    } else {
      const reportDate = new Date(auditInfo.auditReportDate);
      const today = new Date();
      if (reportDate > today) {
        errors.push('Audit report date cannot be in the future');
      }
    }

    // Validate CA details
    if (!auditInfo.caDetails) {
      errors.push('CA details are required');
    } else {
      if (!auditInfo.caDetails.caName || auditInfo.caDetails.caName.trim() === '') {
        errors.push('CA name is required');
      }
      if (!auditInfo.caDetails.membershipNumber || auditInfo.caDetails.membershipNumber.trim() === '') {
        errors.push('CA membership number is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new TaxAuditChecker();

