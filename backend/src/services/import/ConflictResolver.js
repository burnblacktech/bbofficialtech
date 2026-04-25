/**
 * ConflictResolver — Detects and recommends resolutions for
 * cross-document data conflicts in import flows.
 */

const n = (v) => Number(v) || 0;

// Source authority hierarchy — rank determines precedence (lower = higher authority)
const SOURCE_AUTHORITY = {
  '26as': { tier: 'itd', rank: 1 },
  'ais':  { tier: 'itd', rank: 2 },
  'form16':  { tier: 'employer', rank: 3 },
  'form16a': { tier: 'employer', rank: 4 },
  'form16b': { tier: 'employer', rank: 5 },
  'form16c': { tier: 'employer', rank: 6 },
  'manual':  { tier: 'manual', rank: 99 },
};

// Human-readable labels for jsonPayload field paths
const FIELD_LABELS = {
  'income.salary.employers': { section: 'Salary', prefix: 'Employer' },
  'income.otherSources.savingsInterest': { section: 'Other Income', label: 'Savings Interest' },
  'income.otherSources.fdInterest': { section: 'Other Income', label: 'FD Interest' },
  'income.otherSources.dividendIncome': { section: 'Other Income', label: 'Dividend Income' },
  'deductions': { section: 'Deductions' },
  'taxes': { section: 'Taxes Paid' },
};

class ConflictResolver {

  /**
   * Detect conflicts between new import data and existing payload
   * @param {object} existingPayload - Current jsonPayload
   * @param {object} newMappedData - { fieldPath: value } from DataMapper
   * @param {object} existingImportMeta - _importMeta from existing payload
   * @returns {Array} Array of conflict objects
   */
  static detectConflicts(existingPayload, newMappedData, existingImportMeta) {
    const conflicts = [];
    const fieldSources = existingImportMeta?.fieldSources || {};

    for (const [fieldPath, newValue] of Object.entries(newMappedData)) {
      const existingValue = this.getNestedValue(existingPayload, fieldPath);

      // No conflict if field doesn't exist yet
      if (existingValue === undefined || existingValue === null || existingValue === '') continue;

      // No conflict if values are equal
      if (existingValue === newValue) continue;
      if (typeof existingValue === 'number' && typeof newValue === 'number' && Math.abs(existingValue - newValue) < 1) continue;

      const existingSource = fieldSources[fieldPath]?.source || 'manual';
      const newSource = 'pending'; // Will be set by caller based on document type

      const conflict = {
        fieldPath,
        fieldLabel: this.getFieldLabel(fieldPath),
        existingValue,
        newValue,
        existingSource,
        newSource,
        difference: typeof existingValue === 'number' && typeof newValue === 'number' ? Math.abs(existingValue - newValue) : null,
        recommendation: null,
        reason: null,
      };

      // Apply recommendation rules
      this.applyRecommendation(conflict);
      conflicts.push(conflict);
    }

    return conflicts;
  }

  /**
   * Apply recommendation rules based on field path and sources
   */
  static applyRecommendation(conflict) {
    const { fieldPath, existingSource, newSource } = conflict;
    const existingAuth = SOURCE_AUTHORITY[existingSource] || SOURCE_AUTHORITY.manual;
    const newAuth = SOURCE_AUTHORITY[newSource] || SOURCE_AUTHORITY.manual;

    // Field-specific overrides (preserve existing logic)
    if (fieldPath.includes('tdsDeducted')) {
      conflict.recommendation = existingAuth.tier === 'itd' ? existingSource : newSource;
      conflict.reason = '26AS reflects actual TDS credits registered with ITD';
      // If neither is ITD, fall through to general comparison below
      if (existingAuth.tier === 'itd' || newAuth.tier === 'itd') {
        // Manual entries: always flag, no auto-recommendation
        if (existingSource === 'manual') {
          conflict.recommendation = null;
          conflict.reason = 'This value was manually entered. Please verify which is correct.';
        }
        return;
      }
    }
    if (fieldPath.includes('grossSalary') && fieldPath.includes('salary')) {
      const form16Source = [existingSource, newSource].find(s => s === 'form16');
      if (form16Source) {
        conflict.recommendation = 'form16';
        conflict.reason = 'Form 16 is issued by your employer and is the primary salary document';
        // Manual entries: always flag, no auto-recommendation
        if (existingSource === 'manual') {
          conflict.recommendation = null;
          conflict.reason = 'This value was manually entered. Please verify which is correct.';
        }
        return;
      }
    }

    // General tier comparison
    if (existingAuth.rank < newAuth.rank) {
      conflict.recommendation = existingSource;
      conflict.reason = `${existingSource} has higher authority (${existingAuth.tier}) than ${newSource} (${newAuth.tier})`;
    } else if (newAuth.rank < existingAuth.rank) {
      conflict.recommendation = newSource;
      conflict.reason = `${newSource} has higher authority (${newAuth.tier}) than ${existingSource} (${existingAuth.tier})`;
    } else {
      conflict.recommendation = null;
      conflict.reason = 'Both sources have equal authority. Please verify which is correct.';
    }

    // Manual entries: always flag, no auto-recommendation (preserve existing behavior)
    if (existingSource === 'manual') {
      conflict.recommendation = null;
      conflict.reason = 'This value was manually entered. Please verify which is correct.';
    }
  }

  /**
   * Get a human-readable label for a field path
   */
  static getFieldLabel(fieldPath) {
    if (fieldPath.includes('salary.employers')) {
      const match = fieldPath.match(/employers\[(\d+)\]\.(.+)/);
      if (match) {
        const field = match[2].replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        return `Salary — ${field}`;
      }
    }
    if (fieldPath.includes('otherSources')) {
      const field = fieldPath.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      return `Other Income — ${field}`;
    }
    if (fieldPath.startsWith('deductions.')) {
      return `Deductions — ${fieldPath.split('.').pop()}`;
    }
    if (fieldPath.startsWith('taxes.')) {
      return `Taxes Paid — ${fieldPath.split('.').pop().replace(/([A-Z])/g, ' $1')}`;
    }
    return fieldPath;
  }

  /**
   * Get a nested value from an object using dot-notation path
   */
  static getNestedValue(obj, path) {
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }
}

module.exports = ConflictResolver;
module.exports.SOURCE_AUTHORITY = SOURCE_AUTHORITY;
