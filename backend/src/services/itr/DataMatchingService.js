// =====================================================
// DATA MATCHING SERVICE
// Compare manual input vs uploaded/scanned data
// Flag discrepancies with severity levels
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class DataMatchingService {
  constructor() {
    this.discrepancyThresholds = {
      critical: 0.10, // >10% difference
      warning: 0.05,  // 5-10% difference
      info: 0.01,     // 1-5% difference
    };
  }

  /**
   * Compare manual input with uploaded/scanned data
   * @param {Object} manualData - User manually entered data
   * @param {Object} uploadedData - Data from uploaded documents
   * @param {string} dataType - Type of data (income, deduction, etc.)
   * @returns {Array} Array of discrepancy objects
   */
  compareData(manualData, uploadedData, dataType = 'income') {
    const discrepancies = [];

    if (!manualData || !uploadedData) {
      return discrepancies;
    }

    switch (dataType) {
      case 'income':
        return this.compareIncomeData(manualData, uploadedData);
      case 'deduction':
        return this.compareDeductionData(manualData, uploadedData);
      case 'capitalGains':
        return this.compareCapitalGainsData(manualData, uploadedData);
      case 'houseProperty':
        return this.compareHousePropertyData(manualData, uploadedData);
      default:
        return this.compareGenericData(manualData, uploadedData);
    }
  }

  /**
   * Compare income data
   */
  compareIncomeData(manualData, uploadedData) {
    const discrepancies = [];

    // Compare salary
    if (manualData.salary !== undefined && uploadedData.salary !== undefined) {
      const discrepancy = this.calculateDiscrepancy(
        manualData.salary,
        uploadedData.salary,
        'income.salary',
        'Salary Income',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    // Compare other income
    if (manualData.otherIncome !== undefined && uploadedData.otherIncome !== undefined) {
      const discrepancy = this.calculateDiscrepancy(
        manualData.otherIncome,
        uploadedData.otherIncome,
        'income.otherIncome',
        'Other Income',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    return discrepancies;
  }

  /**
   * Compare capital gains data
   */
  compareCapitalGainsData(manualData, uploadedData) {
    const discrepancies = [];

    // Compare STCG total
    const manualSTCG = this.calculateTotalSTCG(manualData);
    const uploadedSTCG = this.calculateTotalSTCG(uploadedData);

    if (manualSTCG > 0 || uploadedSTCG > 0) {
      const discrepancy = this.calculateDiscrepancy(
        manualSTCG,
        uploadedSTCG,
        'income.capitalGains.stcg',
        'Short-term Capital Gains',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    // Compare LTCG total
    const manualLTCG = this.calculateTotalLTCG(manualData);
    const uploadedLTCG = this.calculateTotalLTCG(uploadedData);

    if (manualLTCG > 0 || uploadedLTCG > 0) {
      const discrepancy = this.calculateDiscrepancy(
        manualLTCG,
        uploadedLTCG,
        'income.capitalGains.ltcg',
        'Long-term Capital Gains',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    return discrepancies;
  }

  /**
   * Compare house property data
   */
  compareHousePropertyData(manualData, uploadedData) {
    const discrepancies = [];

    // Compare rental income
    const manualRental = this.calculateTotalRentalIncome(manualData);
    const uploadedRental = this.calculateTotalRentalIncome(uploadedData);

    if (manualRental > 0 || uploadedRental > 0) {
      const discrepancy = this.calculateDiscrepancy(
        manualRental,
        uploadedRental,
        'income.houseProperty.rentalIncome',
        'Rental Income',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    return discrepancies;
  }

  /**
   * Compare deduction data
   */
  compareDeductionData(manualData, uploadedData) {
    const discrepancies = [];

    // Compare Section 80C
    if (manualData.section80C !== undefined && uploadedData.section80C !== undefined) {
      const discrepancy = this.calculateDiscrepancy(
        manualData.section80C,
        uploadedData.section80C,
        'deductions.section80C',
        'Section 80C',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    // Compare Section 80D
    if (manualData.section80D !== undefined && uploadedData.section80D !== undefined) {
      const discrepancy = this.calculateDiscrepancy(
        manualData.section80D,
        uploadedData.section80D,
        'deductions.section80D',
        'Section 80D',
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }

    return discrepancies;
  }

  /**
   * Generic data comparison
   */
  compareGenericData(manualData, uploadedData) {
    const discrepancies = [];

    // Compare numeric fields
    Object.keys(manualData).forEach((key) => {
      if (typeof manualData[key] === 'number' && uploadedData[key] !== undefined) {
        const discrepancy = this.calculateDiscrepancy(
          manualData[key],
          uploadedData[key],
          key,
          key,
        );
        if (discrepancy) discrepancies.push(discrepancy);
      }
    });

    return discrepancies;
  }

  /**
   * Calculate discrepancy between two values
   */
  calculateDiscrepancy(manualValue, uploadedValue, fieldPath, fieldName) {
    const manual = parseFloat(manualValue) || 0;
    const uploaded = parseFloat(uploadedValue) || 0;

    // If both are zero, no discrepancy
    if (manual === 0 && uploaded === 0) {
      return null;
    }

    // Calculate difference
    const difference = Math.abs(manual - uploaded);
    const maxValue = Math.max(manual, uploaded);

    // If max value is zero, skip
    if (maxValue === 0) {
      return null;
    }

    // Calculate percentage difference
    const percentageDiff = difference / maxValue;

    // Determine severity
    let severity = 'info';
    if (percentageDiff >= this.discrepancyThresholds.critical) {
      severity = 'critical';
    } else if (percentageDiff >= this.discrepancyThresholds.warning) {
      severity = 'warning';
    }

    return {
      fieldPath,
      fieldName,
      manualValue: manual,
      uploadedValue: uploaded,
      difference,
      percentageDiff: (percentageDiff * 100).toFixed(2),
      severity,
      message: this.generateDiscrepancyMessage(fieldName, manual, uploaded, percentageDiff, severity),
    };
  }

  /**
   * Generate human-readable discrepancy message
   */
  generateDiscrepancyMessage(fieldName, manual, uploaded, percentageDiff, severity) {
    const diff = Math.abs(manual - uploaded);
    const direction = manual > uploaded ? 'higher' : 'lower';

    if (severity === 'critical') {
      return `${fieldName}: Manual entry (₹${manual.toLocaleString('en-IN')}) is ₹${diff.toLocaleString('en-IN')} ${direction} than uploaded data (₹${uploaded.toLocaleString('en-IN')}). Please verify.`;
    } else if (severity === 'warning') {
      return `${fieldName}: Manual entry differs by ₹${diff.toLocaleString('en-IN')} from uploaded data. Please review.`;
    } else {
      return `${fieldName}: Minor difference of ₹${diff.toLocaleString('en-IN')} between manual entry and uploaded data.`;
    }
  }

  /**
   * Calculate total STCG from capital gains data
   */
  calculateTotalSTCG(data) {
    if (!data || !data.stcgDetails) return 0;
    return (data.stcgDetails || []).reduce(
      (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
      0,
    );
  }

  /**
   * Calculate total LTCG from capital gains data
   */
  calculateTotalLTCG(data) {
    if (!data || !data.ltcgDetails) return 0;
    return (data.ltcgDetails || []).reduce(
      (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
      0,
    );
  }

  /**
   * Calculate total rental income from house property data
   */
  calculateTotalRentalIncome(data) {
    if (!data) return 0;

    if (Array.isArray(data.properties)) {
      return data.properties.reduce((sum, prop) => {
        return sum + (parseFloat(prop.annualRentalIncome) || 0);
      }, 0);
    }

    if (Array.isArray(data)) {
      return data.reduce((sum, prop) => {
        return sum + (parseFloat(prop.annualRentalIncome) || 0);
      }, 0);
    }

    return parseFloat(data.annualRentalIncome) || parseFloat(data.rentalIncome) || 0;
  }

  /**
   * Get discrepancy summary
   */
  getDiscrepancySummary(discrepancies) {
    const summary = {
      total: discrepancies.length,
      critical: discrepancies.filter(d => d.severity === 'critical').length,
      warning: discrepancies.filter(d => d.severity === 'warning').length,
      info: discrepancies.filter(d => d.severity === 'info').length,
    };

    summary.hasDiscrepancies = summary.total > 0;
    summary.needsAttention = summary.critical > 0 || summary.warning > 0;

    return summary;
  }

  /**
   * Group discrepancies by various criteria
   * @param {Array} discrepancies - Array of discrepancy objects
   * @returns {object} Grouped discrepancies
   */
  groupDiscrepancies(discrepancies) {
    const grouped = {
      bySection: {},
      bySource: {},
      bySeverity: {},
      byFieldType: {},
    };

    discrepancies.forEach(discrepancy => {
      // Group by section
      const section = discrepancy.fieldPath?.split('.')[0] || 'other';
      if (!grouped.bySection[section]) {
        grouped.bySection[section] = [];
      }
      grouped.bySection[section].push(discrepancy);

      // Group by source
      const source = discrepancy.source || 'unknown';
      if (!grouped.bySource[source]) {
        grouped.bySource[source] = [];
      }
      grouped.bySource[source].push(discrepancy);

      // Group by severity
      const severity = discrepancy.severity || 'info';
      if (!grouped.bySeverity[severity]) {
        grouped.bySeverity[severity] = [];
      }
      grouped.bySeverity[severity].push(discrepancy);

      // Group by field type
      const fieldType = this.determineFieldType(discrepancy);
      if (!grouped.byFieldType[fieldType]) {
        grouped.byFieldType[fieldType] = [];
      }
      grouped.byFieldType[fieldType].push(discrepancy);
    });

    return grouped;
  }

  /**
   * Determine field type from discrepancy
   * @param {object} discrepancy - Discrepancy object
   * @returns {string} Field type (amount, date, text)
   */
  determineFieldType(discrepancy) {
    const fieldPath = discrepancy.fieldPath || '';
    const fieldName = discrepancy.fieldName || '';

    if (fieldPath.includes('amount') || fieldPath.includes('income') || fieldPath.includes('deduction') || 
        fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('income')) {
      return 'amount';
    }
    if (fieldPath.includes('date') || fieldName.toLowerCase().includes('date')) {
      return 'date';
    }
    return 'text';
  }

  /**
   * Suggest resolution for a discrepancy using AI-powered analysis
   * @param {object} discrepancy - Discrepancy object
   * @param {object} formData - Complete form data for context
   * @returns {object} Suggestion with confidence score
   */
  suggestResolution(discrepancy, formData = {}) {
    const manualValue = parseFloat(discrepancy.manualValue) || 0;
    const uploadedValue = parseFloat(discrepancy.uploadedValue) || 0;
    const source = discrepancy.source || '';

    // Analyze patterns
    let suggestedValue = null;
    let confidence = 0;
    let reasoning = '';

    // Rule 1: If source is AIS/26AS, prefer source value (high confidence)
    if (['AIS', '26AS', 'Form16'].includes(source)) {
      suggestedValue = uploadedValue;
      confidence = 0.85;
      reasoning = `${source} is an official government source, prefer this value`;
    }
    // Rule 2: If discrepancy is small (<5%), prefer manual (user may have corrections)
    else if (discrepancy.percentageDiff < 0.05) {
      suggestedValue = manualValue;
      confidence = 0.70;
      reasoning = 'Small discrepancy, user-entered value may include corrections';
    }
    // Rule 3: If discrepancy is large (>10%), prefer source value
    else if (discrepancy.percentageDiff > 0.10) {
      suggestedValue = uploadedValue;
      confidence = 0.75;
      reasoning = 'Large discrepancy detected, source value is more likely correct';
    }
    // Rule 4: Default to source value for medium discrepancies
    else {
      suggestedValue = uploadedValue;
      confidence = 0.65;
      reasoning = 'Medium discrepancy, source value recommended';
    }

    return {
      suggestedValue,
      confidence,
      reasoning,
      action: 'accept_source',
      alternativeValue: manualValue,
      alternativeAction: 'accept_manual',
    };
  }

  /**
   * Bulk resolve discrepancies
   * @param {Array} discrepancyIds - Array of discrepancy IDs or field paths
   * @param {string} resolution - Resolution action ('accept_manual', 'accept_source', 'custom')
   * @param {object} customValue - Custom value if resolution is 'custom'
   * @returns {object} Resolution result
   */
  bulkResolve(discrepancyIds, resolution, customValue = null) {
    const resolved = [];
    const failed = [];

    discrepancyIds.forEach(id => {
      try {
        resolved.push({
          id,
          resolution,
          customValue,
          resolvedAt: new Date().toISOString(),
        });
      } catch (error) {
        failed.push({
          id,
          error: error.message,
        });
      }
    });

    return {
      success: failed.length === 0,
      resolved,
      failed,
      totalResolved: resolved.length,
    };
  }

  /**
   * Get discrepancy history/resolution audit trail
   * @param {string} filingId - Filing ID
   * @returns {Promise<Array>} Array of resolution records
   */
  async getDiscrepancyHistory(filingId) {
    try {
      // This would query the discrepancy_resolutions table
      // For now, return mock data structure
      const { dbQuery } = require('../../config/database');
      
      const query = `
        SELECT *
        FROM discrepancy_resolutions
        WHERE filing_id = $1
        ORDER BY resolved_at DESC
      `;

      const result = await dbQuery(query, [filingId]);

      return result.rows.map(row => ({
        id: row.id,
        filingId: row.filing_id,
        discrepancyId: row.discrepancy_id,
        fieldPath: row.field_path,
        manualValue: row.manual_value,
        sourceValue: row.source_value,
        resolvedValue: row.resolved_value,
        resolutionAction: row.resolution_action,
        explanation: row.explanation,
        resolvedBy: row.resolved_by,
        resolvedAt: row.resolved_at,
        confidenceScore: parseFloat(row.confidence_score || 0),
      }));
    } catch (error) {
      enterpriseLogger.error('Failed to get discrepancy history', {
        filingId,
        error: error.message,
      });
      return [];
    }
  }
}

module.exports = new DataMatchingService();

