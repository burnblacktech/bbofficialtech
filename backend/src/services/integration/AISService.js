// =====================================================
// AIS (ANNUAL INFORMATION STATEMENT) SERVICE
// Fetches and parses AIS data from Income Tax Department via ERI
// =====================================================

const eriIntegrationService = require('../business/ERIIntegrationService');
const enterpriseLogger = require('../../utils/logger');

class AISService {
  /**
   * Fetch AIS data for a user
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year (e.g., '2024-25')
   * @returns {Promise<Object>} Parsed AIS data
   */
  async fetchAISData(pan, assessmentYear) {
    try {
      enterpriseLogger.info('Fetching AIS data', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
      });

      // Fetch AIS data from ERI service
      const eriResult = await eriIntegrationService.getAIS(pan, assessmentYear);

      if (!eriResult.success || !eriResult.data) {
        throw new Error('Failed to fetch AIS data from ERI');
      }

      const aisData = eriResult.data;

      // Parse AIS data into structured format
      const parsedData = this.parseAISData(aisData, assessmentYear);

      enterpriseLogger.info('AIS data parsed successfully', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        categories: Object.keys(parsedData),
      });

      return {
        success: true,
        data: parsedData,
        rawData: aisData,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      enterpriseLogger.error('AIS fetch failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Parse raw AIS data into structured format
   * @param {Object} aisData - Raw AIS data from ERI
   * @param {string} assessmentYear - Assessment year (optional, for fallback)
   * @returns {Object} Parsed AIS data by category
   */
  parseAISData(aisData, assessmentYear = '2024-25') {
    const parsed = {
      rentalIncome: [],
      capitalGains: [],
      businessIncome: [],
      professionalIncome: [],
      salaryIncome: [],
      interestIncome: [],
      dividendIncome: [],
      otherIncome: [],
      tdsDetails: [],
    };

    // Parse TDS on Rent (Section 194I) - Rental Income
    if (aisData.tdsDetails) {
      const rentTDS = aisData.tdsDetails.filter((tds) => tds.section === '194I' || tds.section === '194IB');
      parsed.rentalIncome = rentTDS.map((tds) => ({
        propertyAddress: tds.propertyAddress || 'N/A',
        landlordName: tds.deductorName || 'N/A',
        amount: parseFloat(tds.amount) || 0,
        tdsDeducted: parseFloat(tds.tdsAmount) || 0,
        period: tds.period || assessmentYear,
        source: 'ais',
        section: tds.section,
      }));
    }

    // Parse Capital Gains from AIS
    if (aisData.capitalGains) {
      parsed.capitalGains = aisData.capitalGains.map((cg) => {
        const purchaseDate = new Date(cg.purchaseDate || cg.acquisitionDate);
        const saleDate = new Date(cg.saleDate || cg.transferDate);
        const holdingPeriod = Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24));
        const isLongTerm = holdingPeriod >= 365;

        return {
          assetName: cg.assetName || cg.scriptName || 'N/A',
          purchaseDate: cg.purchaseDate || cg.acquisitionDate,
          saleDate: cg.saleDate || cg.transferDate,
          purchasePrice: parseFloat(cg.purchasePrice || cg.costOfAcquisition) || 0,
          salePrice: parseFloat(cg.salePrice || cg.saleConsideration) || 0,
          gainAmount: parseFloat(cg.gainAmount || cg.capitalGain) || 0,
          holdingPeriod: holdingPeriod,
          isLongTerm: isLongTerm,
          segment: cg.segment || 'EQUITY',
          source: 'ais',
        };
      });
    }

    // Parse Business Income from AIS (TDS on business payments)
    if (aisData.tdsDetails) {
      const businessTDS = aisData.tdsDetails.filter(
        (tds) => tds.section === '194C' || tds.section === '194H' || tds.section === '194Q'
      );
      parsed.businessIncome = businessTDS.map((tds) => ({
        businessName: tds.deductorName || 'N/A',
        grossReceipts: parseFloat(tds.amount) || 0,
        tdsDeducted: parseFloat(tds.tdsAmount) || 0,
        period: tds.period || assessmentYear,
        source: 'ais',
        section: tds.section,
      }));
    }

    // Parse Professional Income from AIS (TDS on professional fees - Section 194J)
    if (aisData.tdsDetails) {
      const professionalTDS = aisData.tdsDetails.filter((tds) => tds.section === '194J');
      parsed.professionalIncome = professionalTDS.map((tds) => ({
        professionName: tds.deductorName || 'N/A',
        professionalFees: parseFloat(tds.amount) || 0,
        tdsDeducted: parseFloat(tds.tdsAmount) || 0,
        period: tds.period || assessmentYear,
        source: 'ais',
        section: tds.section,
      }));
    }

    // Parse Salary Income from AIS (TDS on Salary - Section 192)
    if (aisData.tdsDetails) {
      const salaryTDS = aisData.tdsDetails.filter((tds) => tds.section === '192');
      parsed.salaryIncome = salaryTDS.map((tds) => ({
        employerName: tds.deductorName || 'N/A',
        salary: parseFloat(tds.amount) || 0,
        tdsDeducted: parseFloat(tds.tdsAmount) || 0,
        period: tds.period || assessmentYear,
        source: 'ais',
        section: tds.section,
      }));
    }

    // Store all TDS details
    if (aisData.tdsDetails) {
      parsed.tdsDetails = aisData.tdsDetails.map((tds) => ({
        section: tds.section,
        deductorName: tds.deductorName,
        amount: parseFloat(tds.amount) || 0,
        tdsAmount: parseFloat(tds.tdsAmount) || 0,
        period: tds.period,
        date: tds.date,
      }));
    }

    return parsed;
  }

  /**
   * Get rental income from AIS
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<Array>} Rental income entries
   */
  async getRentalIncome(pan, assessmentYear) {
    try {
      const result = await this.fetchAISData(pan, assessmentYear);
      return result.data.rentalIncome || [];
    } catch (error) {
      enterpriseLogger.error('Get AIS rental income failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
      });
      // Return empty array on error to allow manual entry
      return [];
    }
  }

  /**
   * Get capital gains from AIS
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<Object>} Capital gains separated by STCG and LTCG
   */
  async getCapitalGains(pan, assessmentYear) {
    try {
      const result = await this.fetchAISData(pan, assessmentYear);
      const allGains = result.data.capitalGains || [];

      const stcg = allGains.filter((g) => !g.isLongTerm);
      const ltcg = allGains.filter((g) => g.isLongTerm);

      return {
        stcgEntries: stcg,
        ltcgEntries: ltcg,
        allGains: allGains,
      };
    } catch (error) {
      enterpriseLogger.error('Get AIS capital gains failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
      });
      return {
        stcgEntries: [],
        ltcgEntries: [],
        allGains: [],
      };
    }
  }

  /**
   * Get business income from AIS
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<Array>} Business income entries
   */
  async getBusinessIncome(pan, assessmentYear) {
    try {
      const result = await this.fetchAISData(pan, assessmentYear);
      return result.data.businessIncome || [];
    } catch (error) {
      enterpriseLogger.error('Get AIS business income failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get professional income from AIS
   * @param {string} pan - PAN number
   * @param {string} assessmentYear - Assessment year
   * @returns {Promise<Array>} Professional income entries
   */
  async getProfessionalIncome(pan, assessmentYear) {
    try {
      const result = await this.fetchAISData(pan, assessmentYear);
      return result.data.professionalIncome || [];
    } catch (error) {
      enterpriseLogger.error('Get AIS professional income failed', {
        pan: pan.substring(0, 5) + '****',
        assessmentYear,
        error: error.message,
      });
      return [];
    }
  }
}

module.exports = new AISService();

