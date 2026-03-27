/**
 * AIS (Annual Information Statement) JSON Parser
 * Extracts income data from all categories: salary, interest, dividends, capital gains, etc.
 * AIS is downloaded from the ITD compliance portal as JSON.
 */

const { AppError } = require('../../../middleware/errorHandler');
const ErrorCodes = require('../../../constants/ErrorCodes');

const n = (v) => Number(v) || 0;

class AISParser {

  /**
   * Parse AIS JSON and extract all income categories
   * @param {object} jsonData - Parsed JSON object
   * @returns {object} Extracted income data by category
   */
  static parse(jsonData) {
    const validation = this.validate(jsonData);
    if (!validation.valid) {
      throw new AppError(`Invalid AIS format: ${validation.errors.join(', ')}`, 422, ErrorCodes.IMPORT_INVALID_SCHEMA);
    }

    const cats = jsonData.categories || {};

    const salary = (cats.salary || []).map(e => ({
      employerName: e.employerName || '',
      employerTAN: (e.employerTAN || '').toUpperCase(),
      grossSalary: n(e.grossSalary),
      tdsDeducted: n(e.tdsDeducted),
    }));

    const interest = (cats.interest || []).map(e => ({
      payerName: e.payerName || '',
      payerTAN: (e.payerTAN || '').toUpperCase(),
      amount: n(e.amount),
      tdsDeducted: n(e.tdsDeducted),
      type: e.type || 'other', // savings, fd, rd
    }));

    const dividends = (cats.dividends || []).map(e => ({
      payerName: e.payerName || '',
      amount: n(e.amount),
      tdsDeducted: n(e.tdsDeducted),
    }));

    const capitalGains = (cats.capitalGains || []).map(e => ({
      assetType: e.assetType || 'other',
      saleConsideration: n(e.saleConsideration),
      purchaseCost: n(e.purchaseCost),
      gainOrLoss: n(e.gainOrLoss),
      holdingPeriod: e.holdingPeriod || 'unknown', // long_term, short_term
    }));

    const otherIncome = (cats.otherIncome || []).map(e => ({
      description: e.description || '',
      payerName: e.payerName || '',
      amount: n(e.amount),
      tdsDeducted: n(e.tdsDeducted),
      sectionCode: e.sectionCode || '',
    }));

    return {
      pan: (jsonData.pan || '').toUpperCase(),
      assessmentYear: jsonData.assessmentYear || '',
      financialYear: jsonData.financialYear || '',
      salary,
      interest,
      dividends,
      capitalGains,
      otherIncome,
      summary: {
        totalSalary: salary.reduce((s, e) => s + e.grossSalary, 0),
        totalInterest: interest.reduce((s, e) => s + e.amount, 0),
        totalDividends: dividends.reduce((s, e) => s + e.amount, 0),
        totalCapitalGains: capitalGains.reduce((s, e) => s + e.gainOrLoss, 0),
        totalOther: otherIncome.reduce((s, e) => s + e.amount, 0),
        totalTDS: salary.reduce((s, e) => s + e.tdsDeducted, 0) + interest.reduce((s, e) => s + e.tdsDeducted, 0) + dividends.reduce((s, e) => s + e.tdsDeducted, 0) + otherIncome.reduce((s, e) => s + e.tdsDeducted, 0),
      },
    };
  }

  /**
   * Validate AIS JSON schema
   * @param {object} jsonData
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(jsonData) {
    const errors = [];
    if (!jsonData || typeof jsonData !== 'object') errors.push('Not a valid JSON object');
    if (!jsonData?.pan) errors.push('Missing PAN');
    if (!jsonData?.assessmentYear) errors.push('Missing assessment year');
    if (!jsonData?.categories || typeof jsonData.categories !== 'object') errors.push('Missing categories object');
    return { valid: errors.length === 0, errors };
  }
}

module.exports = AISParser;
