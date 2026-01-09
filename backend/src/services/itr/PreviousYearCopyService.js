// =====================================================
// PREVIOUS YEAR COPY SERVICE
// Service for copying data from previous year ITR filings
// Supports both database and ERI API sources
// =====================================================

const { Op } = require('sequelize');
const { ITRFiling, ITRDraft } = require('../../models');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const eriIntegrationService = require('../eri/ERIIntegrationService');

class PreviousYearCopyService {
  /**
   * Get available previous year filings for a user
   * @param {string} userId - User ID
   * @param {string} memberId - Member ID (optional, for family members)
   * @param {string} currentAssessmentYear - Current assessment year (e.g., '2024-25')
   * @returns {Promise<Array>} - List of available previous year filings
   */
  async getAvailablePreviousYears(userId, memberId = null, currentAssessmentYear = '2024-25') {
    try {
      enterpriseLogger.info('Fetching available previous years via model', {
        userId,
        memberId,
        currentAssessmentYear,
      });

      const where = {
        userId,
        status: { [Op.in]: ['submitted', 'acknowledged', 'processed'] },
        assessmentYear: { [Op.lt]: currentAssessmentYear }
      };

      if (memberId) {
        where.memberId = memberId;
      } else {
        where.memberId = null;
      }

      const filings = await ITRFiling.findAll({
        where,
        order: [['assessmentYear', 'DESC'], ['createdAt', 'DESC']],
        attributes: [
          'id', 'itrType', 'assessmentYear', 'status',
          'jsonPayload', 'createdAt'
        ]
      });

      const previousYears = filings.map((filing) => {
        const payload = filing.jsonPayload || {};
        const personalInfo = payload.personalInfo || payload.personal_info || {};

        return {
          filingId: filing.id,
          itrType: filing.itrType,
          assessmentYear: filing.assessmentYear,
          status: filing.status,
          createdAt: filing.createdAt,
          summary: {
            name: personalInfo.name || personalInfo.fullName || 'N/A',
            pan: personalInfo.pan || 'N/A',
            totalIncome: this.extractTotalIncome(payload),
            totalDeductions: this.extractTotalDeductions(payload),
            taxPaid: payload.taxesPaid || payload.taxes_paid || {},
          },
        };
      });

      enterpriseLogger.info('Available previous years fetched', {
        userId,
        count: previousYears.length,
      });

      return previousYears;
    } catch (error) {
      enterpriseLogger.error('Failed to get available previous years', {
        userId,
        memberId,
        error: error.message,
      });
      throw new AppError(`Failed to get available previous years: ${error.message}`, 500);
    }
  }

  /**
   * Get complete previous year data for a filing
   * @param {string} filingId - Filing ID
   * @returns {Promise<object>} - Complete ITR data
   */
  async getPreviousYearData(filingId) {
    try {
      enterpriseLogger.info('Fetching previous year data via model', { filingId });

      const filing = await ITRFiling.findByPk(filingId);

      if (!filing) {
        throw new AppError('Previous year filing not found', 404);
      }

      const jsonPayload = filing.jsonPayload || {};

      return {
        filingId: filing.id,
        userId: filing.userId,
        memberId: filing.memberId,
        itrType: filing.itrType,
        assessmentYear: filing.assessmentYear,
        status: filing.status,
        data: jsonPayload,
        sections: this.extractSections(jsonPayload),
      };
    } catch (error) {
      enterpriseLogger.error('Failed to get previous year data', {
        filingId,
        error: error.message,
      });
      throw new AppError(`Failed to get previous year data: ${error.message}`, 500);
    }
  }

  /**
   * Fetch previous year data from ERI API
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<object>} - Previous year data from ERI
   */
  async fetchFromERI(pan, assessmentYear) {
    try {
      enterpriseLogger.info('Fetching previous year data from ERI', { pan, assessmentYear });

      const eriData = await eriIntegrationService.fetchPreviousItrData(pan, assessmentYear);

      if (!eriData || !eriData.previousFiling) {
        throw new AppError('No previous year data found in ERI', 404);
      }

      // Map ERI data to our ITR structure
      return this.mapERIDataToITRFormat(eriData, assessmentYear);
    } catch (error) {
      enterpriseLogger.error('Failed to fetch from ERI', {
        pan,
        assessmentYear,
        error: error.message,
      });
      throw new AppError(`Failed to fetch from ERI: ${error.message}`, 500);
    }
  }

  /**
   * Validate previous year data compatibility with current year
   */
  validatePreviousYearCompatibility(previousData, previousYear, currentYear) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: [],
      incompatibleFields: [],
    };

    try {
      const prevYearNum = parseInt(previousYear.split('-')[0]);
      const currYearNum = parseInt(currentYear.split('-')[0]);
      const yearDiff = currYearNum - prevYearNum;

      if (yearDiff > 3) {
        validation.warnings.push(`Data is from ${yearDiff} years ago. Some fields may have changed.`);
      }

      const requiredFields = ['personalInfo', 'income', 'deductions'];
      const missingFields = requiredFields.filter(field => {
        const snakeCase = field === 'personalInfo' ? 'personal_info' : field;
        return !previousData[field] && !previousData[snakeCase];
      });

      if (missingFields.length > 0) {
        validation.errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        validation.isValid = false;
      }

      if (previousData.income) {
        const totalIncome = this.extractTotalIncome(previousData);
        if (previousData.itrType === 'ITR-1' && totalIncome > 5000000) {
          validation.warnings.push('Total income exceeds ₹50L limit for ITR-1. Consider using ITR-2.');
        }
      }

      enterpriseLogger.info('Compatibility validation completed', { assessmentYear: currentYear });

    } catch (error) {
      enterpriseLogger.error('Compatibility validation failed', { error: error.message });
      validation.errors.push('Failed to validate compatibility: ' + error.message);
      validation.isValid = false;
    }

    return validation;
  }

  mapPreviousYearData(previousData, targetITRType) {
    try {
      const sourceData = previousData.data || previousData;
      const mappedData = {
        personalInfo: this.mapPersonalInfo(sourceData.personalInfo || sourceData.personal_info),
        income: this.mapIncome(sourceData.income, targetITRType),
        deductions: this.mapDeductions(sourceData.deductions),
        taxesPaid: this.mapTaxesPaid(sourceData.taxesPaid || sourceData.taxes_paid),
        bankDetails: this.mapBankDetails(sourceData.bankDetails || sourceData.bank_details),
      };

      mappedData.metadata = {
        copiedFrom: previousData.filingId || previousData.assessmentYear,
        copiedAt: new Date().toISOString(),
        sourceAssessmentYear: previousData.assessmentYear,
        sourceITRType: previousData.itrType,
        targetITRType: targetITRType,
      };

      return mappedData;
    } catch (error) {
      enterpriseLogger.error('Failed to map previous year data', { error: error.message });
      throw new AppError(`Failed to map previous year data: ${error.message}`, 500);
    }
  }

  /**
   * Apply copied data to target filing
   */
  async applyCopy(targetFilingId, sourceFilingId, sectionsToCopy, reviewData = null) {
    try {
      enterpriseLogger.info('Applying copy via models', { targetFilingId, sourceFilingId });

      const targetFiling = await ITRFiling.findByPk(targetFilingId);
      if (!targetFiling) throw new AppError('Target filing not found', 404);

      const targetPayload = targetFiling.jsonPayload || {};
      const targetITRType = targetFiling.itrType;

      let sourceData;
      if (sourceFilingId === 'eri') {
        const pan = targetPayload.personalInfo?.pan || targetPayload.personal_info?.pan;
        if (!pan) throw new AppError('PAN not found in target filing', 400);

        const currentYear = new Date().getFullYear();
        const previousYear = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
        sourceData = await this.fetchFromERI(pan, previousYear);
      } else {
        sourceData = await this.getPreviousYearData(sourceFilingId);
      }

      const mappedData = this.mapPreviousYearData(sourceData, targetITRType);
      const finalData = reviewData ? { ...mappedData, ...reviewData } : mappedData;

      const updatedPayload = { ...targetPayload };

      if (sectionsToCopy.includes('personal_info') || sectionsToCopy.includes('personalInfo')) {
        updatedPayload.personalInfo = finalData.personalInfo;
      }
      if (sectionsToCopy.includes('income')) {
        updatedPayload.income = finalData.income;
      }
      if (sectionsToCopy.includes('deductions')) {
        updatedPayload.deductions = finalData.deductions;
      }
      if (sectionsToCopy.includes('taxes_paid') || sectionsToCopy.includes('taxesPaid')) {
        updatedPayload.taxesPaid = finalData.taxesPaid;
      }
      if (sectionsToCopy.includes('bank_details') || sectionsToCopy.includes('bankDetails')) {
        updatedPayload.bankDetails = finalData.bankDetails;
      }

      updatedPayload.metadata = {
        ...(updatedPayload.metadata || {}),
        ...finalData.metadata,
        copiedSections: sectionsToCopy,
      };

      // Update filing model
      await targetFiling.update({
        jsonPayload: updatedPayload
      });

      // Sync to all drafts for this filing
      const drafts = await ITRDraft.findAll({ where: { filingId: targetFilingId } });
      for (const draft of drafts) {
        // We could selectively update based on step, but for now, full payload sync
        // Or better: only update the draft's data if it matches the copied section
        // For simplicity:
        await draft.update({ data: updatedPayload });
      }

      enterpriseLogger.info('Copy applied successfully via model', { targetFilingId });

      return {
        success: true,
        filingId: targetFilingId,
        updatedData: updatedPayload,
        sectionsCopied: sectionsToCopy,
      };
    } catch (error) {
      enterpriseLogger.error('Failed to apply copy', { targetFilingId, error: error.message });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to apply copy: ${error.message}`, 500);
    }
  }

  // Helpers
  extractTotalIncome(payload) {
    const income = payload.income || {};

    // Robust extraction similar to FinancialStoryService
    const salary = this._getSalaryTotal(income.salary);
    const houseProperty = parseFloat(income.houseProperty?.annualRentalIncome || income.houseProperty?.netRentalIncome || income.houseProperty || 0);
    const capitalGains = this._getCapitalGainsTotal(income.capitalGains);
    const otherSources = parseFloat(income.otherSources?.total || income.otherIncome || income.interestIncome || 0);
    const business = this._getBusinessTotal(income.business);
    const presumptive = this._getPresumptiveTotal(income.presumptive);

    return salary + houseProperty + capitalGains + otherSources + business + presumptive;
  }

  _getSalaryTotal(salaryData) {
    if (!salaryData) return 0;
    if (typeof salaryData === 'number') return salaryData;
    if (Array.isArray(salaryData.employers)) {
      return salaryData.employers.reduce((sum, emp) => sum + (parseFloat(emp.gross || emp.grossSalary || 0)), 0);
    }
    return parseFloat(salaryData.totalSalary || salaryData.grossSalary || 0);
  }

  _getCapitalGainsTotal(cgData) {
    if (!cgData) return 0;
    if (typeof cgData === 'number') return cgData;
    if (Array.isArray(cgData.transactions)) {
      return cgData.transactions.reduce((sum, txn) =>
        sum + (parseFloat(txn.saleValue || 0) - parseFloat(txn.purchaseValue || 0) - parseFloat(txn.expenses || 0)), 0);
    }
    return parseFloat(cgData.total || 0);
  }

  _getBusinessTotal(businessData) {
    if (!businessData) return 0;
    if (typeof businessData === 'number') return businessData;
    if (Array.isArray(businessData.businesses)) {
      return businessData.businesses.reduce((sum, biz) => sum + (parseFloat(biz.netProfit || 0)), 0);
    }
    // Deep fallback for standardised ITR-3 path
    return parseFloat(businessData.profitLoss?.netProfit || businessData.totalIncome || businessData.netProfit || 0);
  }

  _getPresumptiveTotal(presumptiveData) {
    if (!presumptiveData) return 0;
    const bIncome = parseFloat(presumptiveData.business?.presumptiveIncome || 0);
    const pIncome = parseFloat(presumptiveData.professional?.presumptiveIncome || 0);
    return bIncome + pIncome;
  }

  extractSections(payload) {
    return {
      personalInfo: !!(payload.personalInfo || payload.personal_info),
      income: !!payload.income,
      deductions: !!payload.deductions,
      taxesPaid: !!(payload.taxesPaid || payload.taxes_paid),
      bankDetails: !!(payload.bankDetails || payload.bank_details),
    };
  }

  mapPersonalInfo(personalInfo) {
    if (!personalInfo) return null;
    return {
      pan: personalInfo.pan,
      name: personalInfo.name || personalInfo.fullName,
      dob: personalInfo.dob || personalInfo.dateOfBirth,
      address: personalInfo.address,
      city: personalInfo.city,
      state: personalInfo.state,
      pincode: personalInfo.pincode,
      mobile: personalInfo.mobile || personalInfo.phone,
      email: personalInfo.email,
      aadhaar: personalInfo.aadhaar,
    };
  }

  mapIncome(income, targetITRType) {
    if (!income) return {};
    return JSON.parse(JSON.stringify(income)); // Deep clone
  }

  mapDeductions(deductions) {
    return deductions ? JSON.parse(JSON.stringify(deductions)) : {};
  }

  mapTaxesPaid(taxesPaid) {
    if (!taxesPaid) return {};
    return {
      tds: Array.isArray(taxesPaid.tds) ? [...taxesPaid.tds] : [],
      advanceTax: Array.isArray(taxesPaid.advanceTax) ? [...taxesPaid.advanceTax] : [],
      selfAssessmentTax: Array.isArray(taxesPaid.selfAssessmentTax) ? [...taxesPaid.selfAssessmentTax] : [],
      tcs: Array.isArray(taxesPaid.tcs) ? [...taxesPaid.tcs] : [],
    };
  }

  mapBankDetails(bankDetails) {
    return bankDetails ? JSON.parse(JSON.stringify(bankDetails)) : null;
  }

  mapERIDataToITRFormat(eriData, assessmentYear) {
    const previousFiling = eriData.previousFiling || {};
    return {
      filingId: 'eri',
      assessmentYear: assessmentYear,
      itrType: eriData.itrType || 'ITR-1',
      status: 'submitted',
      data: {
        personalInfo: { pan: eriData.pan },
        income: { salary: { totalSalary: previousFiling.totalIncome || 0 } },
        taxesPaid: { tds: [{ amount: previousFiling.taxPaid || 0 }] },
      },
    };
  }
}

module.exports = new PreviousYearCopyService();
