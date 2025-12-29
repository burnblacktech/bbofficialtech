// =====================================================
// AUDIT INFORMATION SERVICE
// Handles audit information operations for ITR-3
// =====================================================

const { query: dbQuery } = require('../../utils/dbQuery');
const enterpriseLogger = require('../../utils/logger');

class AuditInformationService {
  /**
   * Get audit information for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} Audit information data
   */
  async getAuditInformation(filingId) {
    try {
      const query = `
        SELECT json_payload->'auditInfo' as audit_info,
               json_payload->'income'->'business' as business_income,
               json_payload->'income'->'professional' as professional_income
        FROM itr_filings
        WHERE id = $1
      `;
      const result = await dbQuery(query, [filingId]);

      if (result.rows.length === 0) {
        return null;
      }

      const auditInfo = result.rows[0].audit_info || {
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
        result.rows[0].business_income,
        result.rows[0].professional_income
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
      // Get current filing data
      const getQuery = `
        SELECT json_payload FROM itr_filings WHERE id = $1
      `;
      const current = await dbQuery(getQuery, [filingId]);

      if (current.rows.length === 0) {
        throw new Error('Filing not found');
      }

      const jsonPayload = current.rows[0].json_payload || {};
      jsonPayload.auditInfo = auditData;

      // Validate audit information if applicable
      if (auditData.isAuditApplicable) {
        const validation = this.validateAuditReport(auditData);
        if (!validation.isValid) {
          throw new Error(`Audit information validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update filing
      const updateQuery = `
        UPDATE itr_filings
        SET json_payload = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING json_payload->'auditInfo' as audit_info
      `;
      const result = await dbQuery(updateQuery, [JSON.stringify(jsonPayload), filingId]);

      enterpriseLogger.info('Audit information updated', { filingId });

      return result.rows[0].audit_info;
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

