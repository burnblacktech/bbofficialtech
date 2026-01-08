// =====================================================
// AUDIT INFORMATION SERVICE
// Handles audit information operations for ITR-3
// =====================================================

const { ITRFiling } = require('../../models');
const enterpriseLogger = require('../../utils/logger');

class AuditInformationService {
  /**
   * Get audit information for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} Audit information data
   */
  async getAuditInformation(filingId) {
    try {
      const filing = await ITRFiling.findByPk(filingId, {
        attributes: ['jsonPayload']
      });

      if (!filing) {
        return null;
      }

      const payload = filing.jsonPayload || {};
      const auditInfo = payload.auditInfo || {
        isAuditApplicable: false,
        auditReason: '',
        auditReportNumber: '',
        auditReportDate: '',
        caDetails: {
          caName: '',
          membershipNumber: '',
          firmName: '',
          firmAddress: '',
        },
        bookOfAccountsMaintained: false,
        form3CDFiled: false,
      };

      // Check audit applicability
      const applicability = this.checkAuditApplicability(
        payload.income?.business,
        payload.income?.professional
      );

      return {
        ...auditInfo,
        applicability,
      };
    } catch (error) {
      enterpriseLogger.error('Get audit information failed', {
        error: error.message,
        filingId,
      });
      throw error;
    }
  }

  /**
   * Update audit information for a filing
   * @param {string} filingId - Filing ID
   * @param {object} auditData - Audit information data
   * @returns {Promise<object>} Updated audit information
   */
  async updateAuditInformation(filingId, auditData) {
    try {
      const filing = await ITRFiling.findByPk(filingId);

      if (!filing) {
        throw new Error('Filing not found');
      }

      const jsonPayload = filing.jsonPayload || {};
      jsonPayload.auditInfo = auditData;

      // Validate audit information if applicable
      if (auditData.isAuditApplicable) {
        const validation = this.validateAuditReport(auditData);
        if (!validation.isValid) {
          throw new Error(`Audit information validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update filing via model
      filing.jsonPayload = jsonPayload;
      filing.changed('jsonPayload', true);
      await filing.save();

      enterpriseLogger.info('Audit information updated via model', { filingId });

      return filing.jsonPayload.auditInfo;
    } catch (error) {
      enterpriseLogger.error('Update audit information failed', {
        error: error.message,
        filingId,
      });
      throw error;
    }
  }

  /**
   * Check audit applicability based on business/professional income
   * @param {object} businessIncome - Business income data
   * @param {object} professionalIncome - Professional income data
   * @returns {object} Applicability result
   */
  checkAuditApplicability(businessIncome, professionalIncome) {
    const reasons = [];
    let applicable = false;

    // Check business income
    if (businessIncome?.businesses) {
      const totalBusinessTurnover = businessIncome.businesses.reduce((sum, biz) =>
        sum + (biz.pnl?.grossReceipts || 0), 0);

      if (totalBusinessTurnover > 10000000) { // ₹1 crore
        applicable = true;
        reasons.push(`Business turnover (₹${(totalBusinessTurnover / 10000000).toFixed(2)} crores) exceeds ₹1 crore threshold (Section 44AB)`);
      }

      // Check profit threshold (8% of turnover)
      businessIncome.businesses.forEach((biz, index) => {
        const turnover = biz.pnl?.grossReceipts || 0;
        const profit = biz.pnl?.netProfit || 0;
        const profitPercentage = turnover > 0 ? (profit / turnover) * 100 : 0;

        if (turnover > 0 && profitPercentage < 8) {
          applicable = true;
          reasons.push(`Business ${index + 1}: Profit (${profitPercentage.toFixed(2)}%) is less than 8% of turnover (Section 44AB)`);
        }
      });
    }

    // Check professional income
    if (professionalIncome?.professions) {
      const totalProfessionalReceipts = professionalIncome.professions.reduce((sum, prof) =>
        sum + (prof.pnl?.professionalFees || 0), 0);

      if (totalProfessionalReceipts > 5000000) { // ₹50 lakhs
        applicable = true;
        reasons.push(`Professional receipts (₹${(totalProfessionalReceipts / 100000).toFixed(2)} lakhs) exceed ₹50 lakhs threshold (Section 44AB)`);
      }

      // Check profit threshold (50% of receipts)
      professionalIncome.professions.forEach((prof, index) => {
        const receipts = prof.pnl?.professionalFees || 0;
        const profit = prof.pnl?.netIncome || 0;
        const profitPercentage = receipts > 0 ? (profit / receipts) * 100 : 0;

        if (receipts > 0 && profitPercentage < 50) {
          applicable = true;
          reasons.push(`Profession ${index + 1}: Profit (${profitPercentage.toFixed(2)}%) is less than 50% of receipts (Section 44AB)`);
        }
      });
    }

    return {
      applicable,
      reasons,
    };
  }

  /**
   * Validate audit report
   * @param {object} auditInfo - Audit information
   * @returns {object} Validation result
   */
  validateAuditReport(auditInfo) {
    const errors = [];

    if (!auditInfo.isAuditApplicable) {
      return { isValid: true, errors: [] };
    }

    if (!auditInfo.auditReportNumber || auditInfo.auditReportNumber.trim() === '') {
      errors.push('Audit report number is required when tax audit is applicable');
    }

    if (!auditInfo.auditReportDate) {
      errors.push('Audit report date is required when tax audit is applicable');
    }

    if (!auditInfo.caDetails?.caName || auditInfo.caDetails.caName.trim() === '') {
      errors.push('CA name is required when tax audit is applicable');
    }

    if (!auditInfo.caDetails?.membershipNumber || auditInfo.caDetails.membershipNumber.trim() === '') {
      errors.push('CA membership number is required when tax audit is applicable');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new AuditInformationService();
