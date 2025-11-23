// =====================================================
// VALIDATION SERVICE
// Utility validation service for forms and data
// =====================================================

class ValidationService {
  // Email validation
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation (Indian format)
  validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // PAN card validation
  validatePAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  }

  // Aadhaar validation (12 digits)
  validateAadhaar(aadhaar) {
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  }

  // Required field validation
  validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }

  // Numeric validation
  validateNumeric(value, allowDecimal = true) {
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d+$/;
    return regex.test(value.toString());
  }

  // Range validation
  validateRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  // Password validation
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        password.length >= minLength ? null : 'Password must be at least 8 characters long',
        hasUpperCase ? null : 'Password must contain at least one uppercase letter',
        hasLowerCase ? null : 'Password must contain at least one lowercase letter',
        hasNumbers ? null : 'Password must contain at least one number',
        hasSpecialChar ? null : 'Password must contain at least one special character'
      ].filter(error => error !== null)
    };
  }

  // Form field validation
  validateField(field, value, rules = {}) {
    const errors = [];

    // Required validation
    if (rules.required && !this.validateRequired(value)) {
      errors.push(`${field} is required`);
      return { isValid: false, errors };
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return { isValid: true, errors: [] };
    }

    // Type-specific validations
    switch (rules.type) {
      case 'email':
        if (!this.validateEmail(value)) {
          errors.push('Please enter a valid email address');
        }
        break;

      case 'phone':
        if (!this.validatePhone(value)) {
          errors.push('Please enter a valid 10-digit phone number');
        }
        break;

      case 'pan':
        if (!this.validatePAN(value)) {
          errors.push('Please enter a valid PAN card number');
        }
        break;

      case 'aadhaar':
        if (!this.validateAadhaar(value)) {
          errors.push('Please enter a valid 12-digit Aadhaar number');
        }
        break;

      case 'password':
        const passwordResult = this.validatePassword(value);
        if (!passwordResult.isValid) {
          errors.push(...passwordResult.errors);
        }
        break;

      case 'numeric':
        if (!this.validateNumeric(value, rules.allowDecimal)) {
          errors.push('Please enter a valid number');
        }
        break;
    }

    // Range validation
    if (rules.min !== undefined || rules.max !== undefined) {
      const num = parseFloat(value);
      if (rules.min !== undefined && num < rules.min) {
        errors.push(`Value must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push(`Value must not exceed ${rules.max}`);
      }
    }

    // Length validation
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters long`);
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`Must not exceed ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.message || 'Invalid format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Form validation
  validateForm(formData, schema) {
    const results = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = formData[field];
      const validation = this.validateField(field, value, rules);
      results[field] = validation;

      if (!validation.isValid) {
        isValid = false;
      }
    }

    return {
      isValid,
      results,
      errors: Object.entries(results)
        .filter(([, result]) => !result.isValid)
        .flatMap(([field, result]) => result.errors)
    };
  }

  // ITR-specific validations
  validateITRData(itrData) {
    const schema = {
      'personalInfo.fullName': { required: true, type: 'text', minLength: 2 },
      'personalInfo.email': { required: true, type: 'email' },
      'personalInfo.phone': { required: true, type: 'phone' },
      'personalInfo.pan': { required: true, type: 'pan' },
      'personalInfo.aadhaar': { required: false, type: 'aadhaar' },
      'personalInfo.dateOfBirth': { required: true, type: 'date' }
    };

    return this.validateForm(itrData, schema);
  }
}

// Create singleton instance
const validationService = new ValidationService();

export default validationService;