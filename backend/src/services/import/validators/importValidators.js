/**
 * Import Validators
 * PAN and Assessment Year mismatch validation for import pipeline.
 * Used by both SurePass API and PDF upload paths.
 */

const { AppError } = require('../../../middleware/errorHandler');

/**
 * Validate that the PAN from parsed data matches the filing PAN.
 * @param {string} parsedPAN - PAN extracted from document
 * @param {string} filingPAN - PAN on the filing record
 * @throws {AppError} IMPORT_PAN_MISMATCH (409) on mismatch
 */
function validatePANMatch(parsedPAN, filingPAN) {
  if (parsedPAN && filingPAN && parsedPAN.toUpperCase() !== filingPAN.toUpperCase()) {
    throw new AppError(
      `PAN mismatch: document has ${parsedPAN}, filing has ${filingPAN}`,
      409,
      'IMPORT_PAN_MISMATCH',
    );
  }
}

/**
 * Validate that the assessment year from parsed data matches the filing AY.
 * @param {string} parsedAY - Assessment year from document
 * @param {string} filingAY - Assessment year on the filing record
 * @throws {AppError} IMPORT_AY_MISMATCH (409) on mismatch
 */
function validateAYMatch(parsedAY, filingAY) {
  if (parsedAY && filingAY && parsedAY !== filingAY) {
    throw new AppError(
      `Assessment year mismatch: document is for ${parsedAY}, filing is for ${filingAY}`,
      409,
      'IMPORT_AY_MISMATCH',
    );
  }
}

module.exports = { validatePANMatch, validateAYMatch };
