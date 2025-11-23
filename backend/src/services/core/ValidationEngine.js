// =====================================================
// VALIDATION ENGINE
// =====================================================

const fs = require('fs').promises;
const path = require('path');
const enterpriseLogger = require('../utils/logger');

class ValidationEngine {
  constructor() {
    this.rules = new Map();
    this.loadRules();
  }

  /**
   * Load validation rules from JSON files
   */
  async loadRules() {
    try {
      const rulesDir = path.join(__dirname, '../common/rules');
      const ruleFiles = ['itr1.rules.json', 'itr2.rules.json', 'itr3.rules.json', 'itr4.rules.json'];
      
      for (const file of ruleFiles) {
        try {
          const filePath = path.join(rulesDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const rules = JSON.parse(data);
          const itrType = file.replace('.rules.json', '');
          this.rules.set(itrType, rules);
          enterpriseLogger.info(`Loaded validation rules for ${itrType}`);
        } catch (error) {
          enterpriseLogger.warn(`Could not load rules for ${file}`, { error: error.message });
        }
      }
    } catch (error) {
      enterpriseLogger.error('Error loading validation rules', { error: error.message });
    }
  }

  /**
   * Validate ITR data based on type
   * @param {string} itrType - ITR type (itr1, itr2, itr3, itr4)
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validate(itrType, data) {
    try {
      const rules = this.rules.get(itrType);
      if (!rules) {
        return {
          isValid: false,
          errors: [`No validation rules found for ITR type: ${itrType}`]
        };
      }

      const errors = [];
      const warnings = [];

      // Validate required fields
      if (rules.required) {
        for (const field of rules.required) {
          if (!data[field] || data[field] === '') {
            errors.push(`Required field missing: ${field}`);
          }
        }
      }

      // Validate field types and constraints
      if (rules.fields) {
        for (const [fieldName, fieldRules] of Object.entries(rules.fields)) {
          const value = data[fieldName];
          
          if (value !== undefined && value !== null && value !== '') {
            // Type validation
            if (fieldRules.type) {
              if (!this.validateType(value, fieldRules.type)) {
                errors.push(`Invalid type for ${fieldName}: expected ${fieldRules.type}`);
              }
            }

            // Range validation
            if (fieldRules.min !== undefined && value < fieldRules.min) {
              errors.push(`${fieldName} must be at least ${fieldRules.min}`);
            }
            if (fieldRules.max !== undefined && value > fieldRules.max) {
              errors.push(`${fieldName} must be at most ${fieldRules.max}`);
            }

            // Pattern validation
            if (fieldRules.pattern && !new RegExp(fieldRules.pattern).test(value)) {
              errors.push(`Invalid format for ${fieldName}`);
            }

            // Custom validation
            if (fieldRules.custom && !this.validateCustom(value, fieldRules.custom)) {
              errors.push(`Custom validation failed for ${fieldName}`);
            }
          }
        }
      }

      // Business logic validation
      if (rules.businessRules) {
        for (const rule of rules.businessRules) {
          const result = this.validateBusinessRule(data, rule);
          if (!result.isValid) {
            if (rule.severity === 'error') {
              errors.push(result.message);
            } else {
              warnings.push(result.message);
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      enterpriseLogger.error('Validation error', { 
        itrType, 
        error: error.message,
        stack: error.stack 
      });
      
      return {
        isValid: false,
        errors: ['Validation service error']
      };
    }
  }

  /**
   * Validate data type
   * @param {*} value - Value to validate
   * @param {string} type - Expected type
   * @returns {boolean}
   */
  validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'pan':
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
      case 'aadhar':
        return /^[0-9]{12}$/.test(value);
      default:
        return true;
    }
  }

  /**
   * Validate custom rules
   * @param {*} value - Value to validate
   * @param {string} customRule - Custom validation rule
   * @returns {boolean}
   */
  validateCustom(value, customRule) {
    // Implement custom validation logic
    // This can be extended based on specific requirements
    return true;
  }

  /**
   * Validate business rules
   * @param {Object} data - Data to validate
   * @param {Object} rule - Business rule
   * @returns {Object} Validation result
   */
  validateBusinessRule(data, rule) {
    try {
      // Implement business rule validation
      // This can be extended based on specific requirements
      return { isValid: true, message: '' };
    } catch (error) {
      return { 
        isValid: false, 
        message: `Business rule validation error: ${error.message}` 
      };
    }
  }

  /**
   * Get validation rules for a specific ITR type
   * @param {string} itrType - ITR type
   * @returns {Object} Validation rules
   */
  getRules(itrType) {
    return this.rules.get(itrType) || {};
  }

  /**
   * Reload validation rules
   */
  async reloadRules() {
    this.rules.clear();
    await this.loadRules();
    enterpriseLogger.info('Validation rules reloaded');
  }
}

// Create singleton instance
const validationEngine = new ValidationEngine();

module.exports = validationEngine;
